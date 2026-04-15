apiVersion: apps/v1
kind: Deployment
metadata:
  name: pico-web
  namespace: pico
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pico-web
  template:
    metadata:
      labels:
        app: pico-web
    spec:
      containers:
      - name: pico-web
        image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
        ports:
          - containerPort: 80
