# Copy from backend/.env.production.example, then fill secrets.
# Compose will force CLIENT_URL / PUBLIC_API_URL for www.yourmahabaleshwar.com

cp backend/.env.production.example backend/.env
echo "Edit backend/.env — set JWT_*, MONGODB_URI (if Atlas), Razorpay, SMTP, SMS"
echo "Then: docker compose -f docker-compose.prod.yml up -d --build"
