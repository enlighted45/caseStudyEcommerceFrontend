# Verification checklist

## Automated frontend checks

Completed: 11 HTTP/DTO checks and one simulated React journey covering USER, ADMIN,
and TENANT shopping/management flows. All 12 tests passed. The production build passed.
Live backend checks below remain pending. These results do not verify live Keycloak
redirects, backend services, or browser rendering.

Local startup now reads `.env` automatically with Keycloak check-sso login.
Tests cover initial session checking, login/logout, one-time account IDs, automatic
restoration on later logins, and remembered tenant-user IDs. Live Keycloak callbacks,
refresh, and logout redirects still require the real local instance.

See `npm test` for HTTP/DTO checks and simulated UI tests. Production build:
`npm run build`. No running backend credentials or public service URLs were supplied.
Browser QA and the live integration checklist below are separate from these checks.

## Real-backend integration — pending external service access

Record each actual HTTP status/result; do not label an endpoint passed from mock tests.

| Role        | Operation                                         | Expected check                                                                |
| ----------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Public      | POST /auth/signup                                 | Valid account returns 201 and database ID; password excluded from response    |
| USER        | GET/PUT/DELETE /users/{id}                        | Own profile allowed, another user's ID denied; delete uses disposable account |
| USER/TENANT | GET /products                                     | Paginated active products                                                     |
| USER/TENANT | GET /products/name/{name}                         | Partial name search and URL encoding                                          |
| USER/TENANT | GET /products/category/{category}                 | Exact category filtering                                                      |
| USER/TENANT | GET /products/search                              | Both query parameters supplied                                                |
| TENANT      | GET/POST /{tenantName}/products                   | Own tenant list and product creation                                          |
| TENANT      | GET/PUT/DELETE /{tenantName}/products/{productId} | Own product details/update/soft delete; another tenant denied                 |
| ADMIN       | GET/POST /tenants                                 | Paginated list and create; duplicate name error                               |
| ADMIN       | GET/PUT/DELETE /tenants/{id}                      | Details/update/delete; cascade checked on disposable tenant                   |
| ADMIN       | POST /tenantUser                                  | Tenant exists; user created in database and Keycloak                          |
| ADMIN       | GET /tenantUser/{tenantName}                      | Pagination under a tenant                                                     |
| ADMIN       | GET/PUT/DELETE /tenantUser/{tenantName}/{userId}  | Correct tenant membership; Keycloak profile sync/delete                       |
| USER/TENANT | POST /users/{userId}/orders                       | Multiple products; backend totals; quantity decreases                         |
| USER/TENANT | GET /users/{userId}/orders                        | Own order history newest first                                                |
| USER/TENANT | GET /users/{userId}/orders/{orderId}              | Correct order ownership and line totals                                       |
| USER        | POST /users/{userId}/favourites/{productId}       | Created; duplicate tested                                                     |
| USER        | DELETE /users/{userId}/favourites/{productId}     | 204; uses productId rather than favourite ID                                  |
| USER        | GET /users/{userId}/favourites                    | Paginated product IDs/names                                                   |

Additional cases: empty required fields; invalid email; fractional/zero/negative quantities;
price below 1; too much stock ordered; nonexistent IDs; deleted products; empty results;
last-page deletion; expired/invalid tokens; USER attempting ADMIN actions; TENANT attempting
another tenant's product actions; another database user's ID; signup duplicates; network
failure; hosted CORS and HTTPS connectivity; Keycloak callback/logout/token refresh.

Use refresh after checkout to verify the backend changed stock. Totals in the order
response are authoritative. Never use real important accounts for deletion checks.

## UI limits

The backend has no payment or shipping endpoint, no public individual product details
endpoint, no /me endpoint, and no cart API. These are reflected in the UI rather than
invented. Product cards are built from actual API responses; there is no fake successful
backend mode in the deployed app.


