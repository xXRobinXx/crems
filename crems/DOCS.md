# CREMS Energie

CREMS draait volledig lokaal op Home Assistant OS. Open na installatie de webinterface via **Open webinterface**.

De app gebruikt de interne Home Assistant API read-only. De Supervisor-token blijft binnen de app en wordt nooit aan de browser geleverd.

De optionele entiteitsvelden mogen leeg blijven voor automatische detectie. Vul ze alleen in wanneer meerdere geschikte sensoren bestaan.

De webinterface opent uitsluitend via geauthenticeerde Home Assistant Ingress. Poort 8099 is intern en wordt niet rechtstreeks op het LAN gepubliceerd. Open op het Pi-thuisnetwerk Home Assistant op poort 8123 en kies CREMS Energie. Zet **Start bij opstarten** en **Watchdog** aan nadat de eerste start geslaagd is.

