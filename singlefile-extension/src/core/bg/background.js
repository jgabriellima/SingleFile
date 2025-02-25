// Inicializar o módulo SingleFile
async function initializeSingleFile() {
    // Esperar um pouco para garantir que todos os scripts foram carregados
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Initializing SingleFile background...');
    
    if (!window.singlefile) {
        window.singlefile = {
            extension: {
                core: {
                    bg: {}
                }
            }
        };
    }

    // Importar os módulos necessários
    try {
        const business = await import('/lib/single-file-extension-background.js');
        window.singlefile.extension.core.bg.business = business;
        
        console.log('SingleFile background initialized:', {
            singlefileAvailable: !!window.singlefile,
            businessAvailable: !!(window.singlefile?.extension?.core?.bg?.business)
        });
    } catch (error) {
        console.error('Error initializing SingleFile:', error);
    }
}

// Inicializar quando o documento estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSingleFile);
} else {
    initializeSingleFile();
}

// Adicionar listener para mensagens do content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.method === "content.save") {
        // Usar o módulo UI para salvar
        chrome.browserAction.onClicked.dispatch({
            id: sender.tab.id,
            url: sender.tab.url
        });
        sendResponse({ success: true });
        return true;
    }
}); 