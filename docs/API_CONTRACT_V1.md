# Z1 API Contract V1

## Health

`GET /api/v1/health`

Returns service status, API version and timestamp. No sensitive data.

## Properties

`GET /api/v1/properties?city=&status=&page=&pageSize=`

`GET /api/v1/properties/:id`

`POST /api/v1/properties`

`PATCH /api/v1/properties/:id`

`DELETE /api/v1/properties/:id` — restricted; requires explicit authorization and audit event.

## Units and leases

`GET /api/v1/properties/:id/units`

`GET /api/v1/units/:id`

`GET /api/v1/units/:id/lease`

`POST /api/v1/units/:id/lease`

## Finance

`GET /api/v1/accounts`

`GET /api/v1/accounts/:id/transactions?from=&to=&page=&pageSize=`

`POST /api/v1/accounts/:id/transactions`

Financial mutations must be idempotent using an external reference where available.

## Documents

`GET /api/v1/documents?type=&entityType=&entityId=`

`POST /api/v1/documents`

`GET /api/v1/documents/:id`

Binary content is served through controlled storage URLs; the API stores metadata and authorization context.

## Zoë tools

Zoë should call tools rather than arbitrary endpoints:

- `property.search`
- `property.get`
- `finance.summary`
- `finance.transactions`
- `document.search`
- `document.get`
- `report.generate`

Write-capable tools are separate and require confirmation:

- `property.update`
- `lease.create`
- `transaction.create`
- `document.classify`

## Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "requestId": "uuid"
  }
}
```
