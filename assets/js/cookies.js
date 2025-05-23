(function() {
  function showCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
      document.getElementById('cookie-consent').style.display = 'flex';
    }
  }
  function acceptCookieConsent() {
    localStorage.setItem('cookieConsent', 'true');
    document.getElementById('cookie-consent').style.display = 'none';
  }
  document.addEventListener('DOMContentLoaded', function() {
    showCookieConsent();
    var btn = document.getElementById('cookie-consent-btn');
    if (btn) btn.onclick = acceptCookieConsent;
  });
})();