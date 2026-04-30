# Harmony Lab Backend

Stripe → expiring download links (1 hour) → Google Sheets logging.

## Flow

1. User pays via Stripe Checkout (price_id).
2. Stripe sends `checkout.session.completed` to `/stripe/webhook`.
3. Backend:
   - finds product in `Products` sheet by `priceId`
   - creates a 1-hour token
   - writes a row in `Downloads`
   - sends an email with `https://harmonya-download.onrender.com/dl/{token}`
4. User clicks the link:
   - backend checks expiration
   - logs download (timestamp + count)
   - redirects to the Drive file.

## Sheets

### Products

Columns:

- A: ref
- B: name
- C: priceId
- D: driveFileId
- E: genericCartLink

Example formula for `genericCartLink`:

```text
=CONCAT(
 "https://harmonya-cart-panel.onrender.com/add?",
 "price=", C2,
 "&name=", ENCODEURL(B2),
 "&amount=", 12
)
