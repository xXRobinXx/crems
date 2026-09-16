# CREMS Energie voor Home Assistant OS

Deze app draait de CREMS-webinterface en bridge samen op poort 8099. De bridge gebruikt de door Home Assistant verstrekte Supervisor-token uitsluitend voor read-only REST-aanvragen; de token wordt niet naar de browser gestuurd.

De Docker-buildcontext moet de hoofdmap van de CREMS-repository zijn:

```sh
docker build -f apps/home-assistant-addon/crems/Dockerfile -t crems-energy:0.1.0 .
```

GitHub Actions publiceert het ARM64-image naar `ghcr.io/xxrobinxx/crems-energy`. Home Assistant OS kan de hoofdrepository daarna als custom app-repository installeren.
