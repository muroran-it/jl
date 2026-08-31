#!/bin/sh

set -eu

echo "=== Environment ==="
python --version
node --version
npm --version

echo "=== Install jupyter-builder ==="
python -m pip install "jupyter-builder>=1.0.0,<2"

echo "=== jupyter-builder ==="
jupyter-builder --version || true

echo "=== Build jl-moodle-session ==="
cd extension-src/jl-moodle-session

npm install

npm run build:lib

echo "=== LIB ==="
find lib -maxdepth 1 -type f -print

jupyter-builder build --core-version=4.5.1 .

echo "=== LABEXTENSION ==="
find labextension -maxdepth 2 -type f -print

cd ../..

echo "=== Copy prebuilt extension ==="

rm -rf extensions/@morecatlab/jl-moodle-session
mkdir -p extensions/@morecatlab/jl-moodle-session

cp -R \
  extension-src/jl-moodle-session/labextension/. \
  extensions/@morecatlab/jl-moodle-session/

echo "=== PREBUILT EXTENSION ==="
find extensions/@morecatlab/jl-moodle-session \
  -maxdepth 2 -type f -print

echo "=== Build JupyterLite ==="

jupyter lite doit \
  --contents content \
  --output-dir dist \
  --FederatedExtensionAddon.extra_labextensions_path="$(pwd)/extensions" \
  -- \
  --backend=json pre_build build post_build

echo "=== Build complete ==="