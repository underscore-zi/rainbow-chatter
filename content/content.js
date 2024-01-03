const __ID = 'rainbow-chatter';

// Only inject if its not already injected. This really only happens when reloading the extension.
// This means we need to do a full page-refresh to get new code injected, which is desired anyhow.
if(!document.getElementById(__ID)) {
    var s = document.createElement('script');
    s.id = __ID;
    s.src = chrome.extension.getURL('content/intercept.js');
    (document.head || document.documentElement).prepend(s);   
}
