// Injetar o script na página
function injectScript() {
    console.log('SingleFile: Injecting script...');
    const script = document.createElement('script');
    script.textContent = `
        // Criar o objeto singlefile global
        if (typeof window.singlefile === "undefined") {
            window.singlefile = {
                processors: {},
                extension: {}
            };
        }

        // Adicionar função de trigger
        window.triggerSingleFile = async function(options = {}) {
            console.log('SingleFile: Trigger called with options:', options);
            const defaultOptions = {
                removeFrames: false,
                removeScripts: true,
                removeVideoSrc: true,
                removeAudioSrc: true,
                filename: document.title + '.html'
            };
            
            return new Promise((resolve, reject) => {
                const event = new CustomEvent('single-file-save-page', {
                    detail: { ...defaultOptions, ...options }
                });
                
                const handleResponse = (e) => {
                    console.log('SingleFile: Received response:', e.detail);
                    document.removeEventListener('single-file-save-complete', handleResponse);
                    if (e.detail && e.detail.error) {
                        reject(new Error(e.detail.error));
                    } else {
                        resolve(e.detail);
                    }
                };
                
                document.addEventListener('single-file-save-complete', handleResponse);
                console.log('SingleFile: Dispatching save event');
                document.dispatchEvent(event);
            });
        };
    `;
    (document.head || document.documentElement).appendChild(script);
    console.log('SingleFile: Script injected');
}

// Escutar o evento da página
document.addEventListener('single-file-save-page', async (event) => {
    console.log('SingleFile: Save page event received', event.detail);
    try {
        // Verificar se a extensão está disponível
        if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
            throw new Error('Extension not available');
        }

        console.log('SingleFile: Sending message to background script');
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                method: "content.save",
                tabId: -1,
                options: event.detail
            }, response => {
                console.log('SingleFile: Raw response from background:', response);
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        console.log('SingleFile: Processed response from background:', response);

        if (response && response.error) {
            throw new Error(response.error);
        }

        document.dispatchEvent(new CustomEvent('single-file-save-complete', { 
            detail: response 
        }));
    } catch (error) {
        console.error('SingleFile error:', error);
        document.dispatchEvent(new CustomEvent('single-file-save-complete', { 
            detail: { error: error.message || 'Unknown error' } 
        }));
    }
});

// Injetar o script quando o documento estiver pronto
function tryInjectScript() {
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectScript);
        } else {
            injectScript();
        }
    } catch (error) {
        console.error('Failed to inject script:', error);
        // Tentar novamente em 1 segundo
        setTimeout(tryInjectScript, 1000);
    }
}

tryInjectScript();

// Reinjeta o script se a extensão for recarregada
chrome.runtime.onConnect.addListener(() => {
    tryInjectScript();
});

// Verificar se o objeto singlefile está disponível
console.log('SingleFile object:', window.singlefile);

// Verificar se o business module está disponível
console.log('Business module:', window.singlefile?.extension?.core?.bg?.business); 