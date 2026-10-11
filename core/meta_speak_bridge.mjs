/** Prepares a Meta Messenger audio attachment, but deliberately never publishes. */
export function buildMetaMessengerAudioMessage(publicAudioUrl) {
  if (typeof publicAudioUrl !== 'string') throw new TypeError('audio_url_required');
  let url;
  try { url = new URL(publicAudioUrl); } catch { throw new TypeError('invalid_audio_url'); }
  if (url.protocol !== 'https:' || url.username || url.password || !url.hostname ||
      ['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) {
    throw new TypeError('public_https_url_required');
  }
  return {
    message: { attachment: { type: 'audio', payload: { url: url.href, is_reusable: false } } }
  };
}
