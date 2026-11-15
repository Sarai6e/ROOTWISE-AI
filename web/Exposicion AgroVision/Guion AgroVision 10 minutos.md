# Guion de exposición · AgroVision AI

**Duración total: 10 minutos, incluida la demostración.** Habla con calma y usa los tiempos como marcas. Las indicaciones en cursiva son acciones para ti.

**Antes de empezar:** abre el PowerPoint y deja el navegador en [AgroVision AI](http://127.0.0.1:8765). Si el servidor está apagado, ejecuta `iniciar.cmd` desde la carpeta del proyecto. Deja a mano la carpeta **Fotos para la demo**. En la diapositiva 6 puedes abrir la web con el enlace o cambiar de ventana con **Alt + Tab**.

## 1. Presentación (0:00–0:45)

Buenos días. Hoy les presento AgroVision AI, un proyecto de visión por computadora que analiza fotografías de hojas de tomate. La idea es que una persona pueda cargar una imagen y recibir una primera orientación sobre lo que aparece en ella. Voy a explicar cómo preparé los datos, qué dos variantes comparé y por qué elegí una para la aplicación. Luego voy a abrir la web y analizar dos fotografías en vivo para que vean el proceso completo.

## 2. Objetivo y datos (0:45–2:00)

El problema que quise abordar fue la clasificación de hojas de tomate a partir de una foto. Algunas alteraciones de la hoja se parecen visualmente, así que el modelo busca patrones en la imagen para asignarla a una de diez clases. En ese conjunto está la hoja sana y también están categorías como el tizón temprano y la mancha foliar por septoria.

Para entrenar y evaluar el modelo usé las fotografías etiquetadas de tomate de PlantVillage. El conjunto quedó dividido en entrenamiento, validación y prueba. El entrenamiento permitió ajustar el clasificador. La validación sirvió para elegir el mejor punto de cada entrenamiento y la prueba se reservó para la comparación final. Las fotos de una misma hoja identificada se agruparon para evitar que imágenes muy parecidas de esa hoja quedaran entre los datos de entrenamiento y los de evaluación. En la prueba final se usaron 3.639 imágenes.

## 3. Comparación de RGB y máscara HSV (2:00–3:25)

La pregunta del experimento fue si quitar parte del fondo ayuda a clasificar mejor la hoja. Preparé dos variantes. En la primera usé la fotografía completa en RGB, es decir, en los canales rojo, verde y azul. En la segunda apliqué una máscara calculada en HSV, un espacio de color que separa el tono, la saturación y el valor. La máscara decide qué región conservar. En esa región, la imagen mantiene sus colores RGB.

*Señala las tres imágenes de la diapositiva.*

Aquí podemos ver la foto original, la máscara y el resultado. Para que la comparación fuera justa, usé las mismas fotos, las mismas particiones y la misma arquitectura, MobileNetV2 preentrenada. Esa red sirvió como extractora de características. El clasificador aprendió a relacionar esas características con las diez clases. Así pude comparar el efecto de cambiar la entrada con las demás condiciones de entrenamiento en común.

## 4. Resultados (3:25–4:45)

En la prueba, la variante RGB obtuvo un F1 macro de 88,30 por ciento y una exactitud de 91,43 por ciento. La variante con máscara HSV obtuvo un F1 macro de 85,58 por ciento y una exactitud de 88,90 por ciento.

La exactitud indica qué proporción de todas las fotos se clasificó correctamente. El F1 macro primero combina precisión y cobertura para cada clase y luego da el mismo peso a las diez clases. Por eso lo usé como métrica principal para la comparación.

La diferencia de F1 macro fue de 2,72 puntos porcentuales a favor de RGB. En este conjunto de prueba, la foto completa dio el mejor resultado en las dos métricas. Con ese resultado elegí el modelo RGB para integrarlo en la aplicación web.

## 5. Funcionamiento de la aplicación (4:45–5:40)

La aplicación funciona en el navegador y se conecta a un servidor local en Python. Cuando selecciono una foto y presiono el botón de análisis, el servidor recibe la imagen, la convierte a RGB y ajusta su tamaño a 160 por 160 píxeles. Luego ejecuta el modelo en TensorFlow.

El modelo calcula un puntaje para cada una de las diez clases. La web destaca la clase con el puntaje más alto y muestra las otras dos opciones con mayor puntaje. Esos porcentajes corresponden a la foto que acabo de cargar. El F1 macro de la diapositiva anterior resume el rendimiento en todo el conjunto de prueba.

## 6. Demostración en vivo (5:40–9:00)

**5:40–6:15.** Ahora voy a abrir AgroVision en el navegador. Para mostrar cómo cambia el resultado, preparé dos fotos etiquetadas de tomate del conjunto de prueba. Esta primera corresponde a una hoja sana. Aquí aparece la vista previa de la imagen que voy a enviar al modelo.

*Abre AgroVision, carga `01 Hoja sana.jpg` y señala la vista previa.*

**6:15–7:05.** Presiono **Analizar imagen**. En el panel de la derecha aparece la predicción principal. En este caso, el modelo coloca **Hoja sana** en primer lugar. Voy a leer el porcentaje que aparece en pantalla. Debajo están las otras dos clases que el modelo consideró más probables. Podemos ver cuánto se separa la primera opción de las siguientes para esta imagen.

*Haz clic en el botón, espera a que aparezca el resultado y señala el primer lugar y las barras. En el ensayo, la pantalla mostró 98,8 %.*

**7:05–8:05.** Ahora voy a cambiar la imagen. La segunda foto está etiquetada como mancha foliar por septoria. Si observan la vista previa, se aprecian manchas en la hoja. Voy a lanzar el análisis con el mismo botón. Esta vez cambia la primera opción: el modelo coloca **Mancha foliar por septoria** en primer lugar. Voy a leer el porcentaje que aparece y señalar la segunda opción.

*Usa **Cambiar imagen**, elige `02 Hoja con septoria.jpg` y vuelve a presionar **Analizar imagen**. En el ensayo, la pantalla mostró 99,7 %.*

**8:05–9:00.** En las dos fotos vimos el recorrido completo: cargar la imagen, ejecutar el modelo y recibir una lista ordenada de resultados. El modelo ya estaba entrenado. Lo que ocurrió en vivo fue la inferencia, que es el cálculo de una predicción nueva al enviar cada foto. Estas dos imágenes muestran cómo se usa el prototipo. La comparación de los modelos se hizo con el conjunto completo de prueba que mostré antes.

*Vuelve al PowerPoint con **Alt + Tab** y pasa a la diapositiva 7.*

## 7. Alcance y cierre (9:00–10:00)

Para cerrar, esta captura muestra un límite importante. La foto cargada es de una hoja de uva del conjunto PlantVillage. Aun así, el sistema mostró septoria con 98,2 por ciento. Como solo conoce diez clases de tomate, asigna la imagen a una de ellas incluso cuando recibe una hoja de otro cultivo. Por eso, el porcentaje se interpreta dentro de las clases que el modelo aprendió y el resultado sirve como orientación.

Con este trabajo pasé de un experimento con dos formas de preparar las imágenes a un prototipo que puedo usar desde el navegador. El siguiente paso sería probarlo con fotos de campo con distintos fondos e iluminaciones y añadir una forma de rechazar imágenes fuera de su alcance. Muchas gracias.

*Si la web falla durante la exposición, sigue con la diapositiva 7 y presenta su captura como una prueba previa con una hoja fuera del alcance. Puedes mostrar las dos fotos de tomate como las entradas preparadas para la demo y mencionar por separado los resultados del ensayo.*
