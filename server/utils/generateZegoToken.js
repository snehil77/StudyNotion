// server/utils/generateZegoToken.js
const crypto = require("crypto")

/**
 * Generate ZegoCloud Kit Token
 * Based on official ZegoCloud server-side token v04 spec
 */
function generateZegoToken({ appID, serverSecret, roomID, userID, userName, expiry = 7200 }) {
  const now        = Math.floor(Date.now() / 1000)
  const expireTime = now + expiry
  const nonce      = Math.floor(Math.random() * 2147483647)

  // Payload
  const payload = JSON.stringify({
    app_id:      Number(appID),
    room_id:     roomID,
    user_id:     userID,
    user_name:   userName,
    privilege:   { 1: 1, 2: 1 },
    nonce:       nonce,
    create_time: now,
    expire_time: expireTime,
  })

  // AES-128-CBC encrypt
  const key      = Buffer.from(serverSecret.slice(0, 16), "utf8")
  const iv       = crypto.randomBytes(16)
  const cipher   = crypto.createCipheriv("aes-128-cbc", key, iv)
  let encrypted  = cipher.update(Buffer.from(payload, "utf8"))
  encrypted      = Buffer.concat([encrypted, cipher.final()])

  // Pack: [version(2)] + [expireTime(4)] + [ivLen(2)] + [iv(16)] + [payloadLen(4)] + [encrypted]
  const buf = Buffer.alloc(2 + 4 + 2 + 16 + 4 + encrypted.length)
  let offset = 0

  buf.writeUInt16BE(4, offset); offset += 2                        // version = 4
  buf.writeUInt32BE(expireTime, offset); offset += 4               // expire time
  buf.writeUInt16BE(16, offset); offset += 2                       // iv length
  iv.copy(buf, offset); offset += 16                               // iv
  buf.writeUInt32BE(encrypted.length, offset); offset += 4         // payload length
  encrypted.copy(buf, offset)                                      // encrypted payload

  return "04" + buf.toString("base64")
}

module.exports = generateZegoToken
