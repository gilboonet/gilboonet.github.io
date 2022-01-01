#!/bin/bash
sed -i "/\<g\>/d" $1
sed -i "s/stroke-width\=\"1\"/fill=\"none\" stroke-width\=\"0.1\"/g" $1
sed -i "s/,255)\"/)\"/g" $1
