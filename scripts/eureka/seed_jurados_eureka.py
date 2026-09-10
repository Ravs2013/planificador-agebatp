#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EUREKA 2026 — Alta del padron operativo de jurados evaluadores en Firestore.

Escribe la coleccion `eurekaJuradosEvaluadores`, usando el DNI normalizado a 8 digitos
como identificador de documento.

Uso:
    python seed_jurados_eureka.py [--dry-run] [--seed RUTA] [--cred RUTA]

Por defecto lee ../../../EUREKA/eurekaJurados.seed.json y las credenciales de
../../serviceAccountKey.json (relativas a este archivo).

Notas sobre los datos de origen:
  - El Excel original guarda unos DNI como texto y otros como numero. Se normaliza
    siempre con padStart(8, '0') equivalente, para no perder los ceros a la izquierda.
  - El correo 'maranac@ugel 03.gob.pe' traia un espacio y era invalido. Se sanea aqui y
    se conserva el valor original en `correoOriginal`.
  - El desglose apellidos/nombres es una inferencia en la mayoria de los registros. El
    campo `requiereValidacionNombre` viaja a Firestore para que la pantalla de validacion
    del modulo obligue a confirmarlo antes de imprimirlo en un anexo firmado.
"""

import argparse
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
SEED_POR_DEFECTO = os.path.normpath(os.path.join(AQUI, "..", "..", "..", "EUREKA", "eurekaJurados.seed.json"))
CRED_POR_DEFECTO = os.path.normpath(os.path.join(AQUI, "..", "..", "serviceAccountKey.json"))
COLECCION = "eurekaJuradosEvaluadores"


def normalizar_dni(valor):
    digitos = re.sub(r"\D", "", str(valor if valor is not None else ""))
    if not digitos:
        return ""
    return digitos[-8:] if len(digitos) >= 8 else digitos.rjust(8, "0")


def sanear_correo(valor):
    return re.sub(r"\s+", "", str(valor if valor is not None else "")).strip().lower()


def preparar(jurado):
    dni = normalizar_dni(jurado.get("dni"))
    doc = dict(jurado)
    doc.pop("_nota", None)
    doc["dni"] = dni
    doc["correo"] = sanear_correo(jurado.get("correo"))
    doc["correoOriginal"] = jurado.get("correoOriginal", jurado.get("correo", ""))
    doc["celular"] = re.sub(r"\s+", "", str(jurado.get("celular", "")))
    doc["activo"] = bool(jurado.get("activo", True))
    doc["eventoId"] = "EUREKA-2026"
    doc["etapa"] = "UGEL"
    return dni, doc


def main():
    parser = argparse.ArgumentParser(description="Siembra el padron de jurados de Eureka 2026 en Firestore.")
    parser.add_argument("--seed", default=SEED_POR_DEFECTO, help="Ruta del archivo eurekaJurados.seed.json")
    parser.add_argument("--cred", default=CRED_POR_DEFECTO, help="Ruta de la clave de cuenta de servicio")
    parser.add_argument("--dry-run", action="store_true", help="Muestra lo que se escribiria sin tocar Firestore")
    args = parser.parse_args()

    if not os.path.exists(args.seed):
        print("No se encontro el archivo semilla: %s" % args.seed)
        return 1

    with open(args.seed, "r", encoding="utf-8") as f:
        data = json.load(f)

    jurados = data.get("jurados", [])
    if not jurados:
        print("El archivo semilla no contiene jurados.")
        return 1

    preparados = []
    rechazados = []
    for j in jurados:
        dni, doc = preparar(j)
        if len(dni) != 8:
            rechazados.append((j.get("nombreOriginal", "?"), "DNI invalido: %r" % j.get("dni")))
            continue
        preparados.append((dni, doc))

    print("Coleccion destino : %s" % COLECCION)
    print("Registros validos : %d" % len(preparados))
    print("Registros rechazados: %d" % len(rechazados))
    for nombre, motivo in rechazados:
        print("  - %s -> %s" % (nombre, motivo))

    pendientes = [d for _, d in preparados if d.get("requiereValidacionNombre") or d.get("tildesInferidas")]
    if pendientes:
        print("")
        print("ATENCION: %d registro(s) requieren validacion humana del desglose de nombres" % len(pendientes))
        print("antes de que se impriman en un anexo firmado:")
        for d in pendientes:
            print("  - %s (DNI %s) <- original: %s" % (d["nombreCompleto"], d["dni"], d.get("nombreOriginal", "")))

    if args.dry_run:
        print("")
        print("Modo dry-run: no se escribio nada en Firestore.")
        return 0

    if not os.path.exists(args.cred):
        print("No se encontro la clave de cuenta de servicio: %s" % args.cred)
        return 1

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("Falta la dependencia firebase-admin. Instalela con: pip install firebase-admin")
        return 1

    cred = credentials.Certificate(args.cred)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()

    lote = db.batch()
    escritos = 0
    for dni, doc in preparados:
        ref = db.collection(COLECCION).document(dni)
        lote.set(ref, doc, merge=True)
        escritos += 1
        if escritos % 400 == 0:
            lote.commit()
            lote = db.batch()
    lote.commit()

    print("")
    print("Se escribieron %d jurados evaluadores en %s." % (escritos, COLECCION))
    return 0


if __name__ == "__main__":
    sys.exit(main())
