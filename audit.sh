echo "NPM auditing frontend dependencies"
cd frontend
npm audit

echo "NPM auditing backend dependencies"
cd ../backend
npm audit

echo "Scan code with Trivy"
cd ..
docker run --rm -v $(pwd):/project -w /project aquasec/trivy:latest fs .
