# ── Stage 1: Build React Frontend ──
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Node Backend & Combine ──
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend dist from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "index.js"]
