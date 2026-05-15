# **Modificaciones**

## **Contexto**: 
En esta aplicación que realmente solo es un html y un .js en un worker de cloudfare

1. Incluir un campo de formación: Poner el nivel de formación más alto alcanzado e Institución donde se consiguió y una sección de texto para ponerla.
2. Incluir un campo de edad o rango etario
2. Poder subir una hoja de vida para la generación de la respuesta, SIN OCR, solo texto. 
3. Quieren que pueda tener un registro de todas las personas que respondieron (necesito que pongas entonces un texto diciendo que si hace el análisis acepta el tratamiento de información personal de la Escuela de Gobierno de la Universidad de la Sabana). La idea es guardar el metadato de la persona, junto a su respuesta en un google sheet (https://docs.google.com/spreadsheets/d/1ZHFbuRnPmdCm4BcvWPhts9r4HOlnJmvXVbI5OncSmL0/edit?usp=sharing) y que las hojas de vida de los candidatos estén en una carpeta de google drive (https://drive.google.com/drive/folders/1Wk35qbT0xSEQL9hXMtCP3IQQM7o38l9P?usp=sharing), no se si toque guardar esos links dentro de los "secretos" de cloudfare para que nadie tenga acceso a esa información. 
4. Cambiar el prompt inicial para que la creación del reporte para que su objetivo sea decir "con este programa fortalecerás tus habilidades o de líder, o de estratega o de gerente... Es decir como que vean dónde esta su oportunidad de crecimiendo en nuestro perfil del graduado"
5. Cambiar el output de la herramienta para quitar la ficha interna
6. Incluir una frase potente, con tipo de letra de título al final del reporte única para cada participante.

## **Aclaración**

Realiza las modificaciones que necesites en los documentos .js pero dime si tengo que hacer esa modificación en el cloudfare