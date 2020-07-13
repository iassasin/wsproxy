# WebSocket proxy

This project proxies connection to configured websocket server via rest api and long polling.

## Usage

- `POST /open` - initiate connection to websocket server, returns json object, contained `connectionId`
- `GET /events?connectionId={id}` - get events as array of event objects. If there no events in connection, waits configured time interval in mills for events. If no events triggered, returns empty array. For example:
```
[
	{type: 'message', data: 'hello, world from ws'},
	{type: 'error', error: 'some message'}
]
```
- `POST /message?connectionId={id}` - send message to websocket server. Sends POST body as is.
- `POST /close?connectionId={id}` - closes the websocket connection

## Config

See `./config.json`
