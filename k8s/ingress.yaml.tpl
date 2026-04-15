apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pico-web
  namespace: pico
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - ${DOMAIN}
    secretName: jamespacheco-dev-tls
  rules:
  - host: ${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: pico-web
            port:
              number: 80
