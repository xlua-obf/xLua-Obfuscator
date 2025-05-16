document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const obfuscateBtn = document.getElementById('obfuscate-btn');
    const resultContainer = document.querySelector('.result-container');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const newFileBtn = document.getElementById('new-file-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const form = document.getElementById('upload-form');
    const customOptions = document.querySelector('.custom-options');
    const dropZone = document.querySelector('.file-upload-container');
    const monacoContainer = document.getElementById('monaco-editor-container');
    
    const errorModal = document.getElementById('error-modal');
    const errorTitle = document.getElementById('error-title');
    const errorMessage = document.getElementById('error-message');
    const errorCode = document.getElementById('error-code');
    const errorOkBtn = document.getElementById('error-ok-btn');
    
    let currentFileId = null;
    let editor = null;
    
    function showError(title, message, code = null) {
        errorTitle.textContent = title || 'Error';
        errorMessage.textContent = message || 'An unexpected error occurred.';
        
        if (code) {
            errorCode.textContent = code;
            errorCode.style.display = 'block';
        } else {
            errorCode.style.display = 'none';
        }
        
        errorModal.classList.add('active');
    }
    
    function hideError() {
        errorModal.classList.remove('active');
    }
    
    function handleHttpError(status) {
        let title = 'Server Error';
        let message = 'An unexpected server error occurred.';
        let code = 'HTTP_' + status;
        
        switch(status) {
            case 400:
                title = 'Invalid Request';
                message = 'The request could not be processed due to invalid parameters or format.';
                break;
            case 401:
                title = 'Authentication Required';
                message = 'You need to be authenticated to perform this action.';
                break;
            case 403:
                title = 'Access Forbidden';
                message = 'You do not have permission to access this resource.';
                break;
            case 404:
                title = 'Not Found';
                message = 'The requested resource could not be found on the server.';
                break;
            case 413:
                title = 'File Too Large';
                message = 'The uploaded file is too large. Please use a smaller file.';
                break;
            case 429:
                title = 'Too Many Requests';
                message = 'You have made too many requests. Please wait a moment and try again.';
                break;
            case 500:
                title = 'Server Error';
                message = 'The server encountered an internal error. Our team has been notified.';
                break;
            case 502:
                title = 'Bad Gateway';
                message = 'The server is temporarily unavailable. Please try again in a few minutes.';
                break;
            case 503:
                title = 'Service Unavailable';
                message = 'The obfuscation service is currently unavailable. Please try again later.';
                break;
            case 504:
                title = 'Gateway Timeout';
                message = 'The server took too long to respond. The obfuscation process may be too complex or the server is under heavy load.';
                break;
        }
        
        showError(title, message, code);
    }
    
    errorOkBtn.addEventListener('click', hideError);
    
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('drop-zone-highlight');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drop-zone-highlight');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files.length > 0) {
            droppedFile = files[0]; 
            handleFiles(files);
        }
    }
    
    function handleFiles(files) {
        try {
            if (!files || files.length === 0) {
                console.error('No files provided to handleFiles');
                return;
            }
            
            const file = files[0];
            console.log('Processing file:', file.name, file.type, file.size);
            
            if (!file.name.toLowerCase().endsWith('.lua') && !file.name.toLowerCase().endsWith('.txt')) {
                showError('Invalid File Type', 'Please select a Lua file (.lua extension) or a text file containing Lua code (.txt)');
                return;
            }
            
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            obfuscateBtn.disabled = false;
        } catch (error) {
            console.error('Error handling files:', error);
            showError('File Processing Error', 'There was an error processing the selected file. Please try again.', 'ERR_FILE_PROCESSING');
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1048576) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / 1048576).toFixed(1) + ' MB';
        }
    }
    
    const presetRadios = document.querySelectorAll('input[name="preset"]');
    presetRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const preset = this.value;
            
            if (preset === 'none') {
                customOptions.style.display = 'block';
            } else {
                customOptions.style.display = 'none';
            }
        });
    });
    
    function setPresetOptions(options) {
        document.querySelector('input[name="controlFlow"]').checked = options.controlFlow || false;
        document.querySelector('input[name="stringEncoding"]').checked = options.stringEncoding || false;
        document.querySelector('input[name="variableRenaming"]').checked = options.variableRenaming || false;
        document.querySelector('input[name="garbageCode"]').checked = options.garbageCode || false;
        document.querySelector('input[name="opaquePredicates"]').checked = options.opaquePredicates || false;
        document.querySelector('input[name="functionInlining"]').checked = options.functionInlining || false;
        document.querySelector('input[name="compressor"]').checked = options.compressor || false;
        document.querySelector('input[name="bytecodeEncoder"]').checked = options.bytecodeEncoder || false;
        document.querySelector('input[name="stringToExpressions"]').checked = options.stringToExpressions || false;
        document.querySelector('input[name="vmGenerator"]').checked = options.vmGenerator || false;
        document.querySelector('input[name="wrapInFunction"]').checked = options.wrapInFunction || false;
        document.querySelector('input[name="antiTamper"]').checked = options.antiTamper || false;
    }
    
    let droppedFile = null;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        try {
            const file = droppedFile || (fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null);
            
            if (!file) {
                showError('No File Selected', 'Please select a Lua file to obfuscate.');
                return;
            }
            
            if (!file.name.toLowerCase().endsWith('.lua') && !file.name.toLowerCase().endsWith('.txt')) {
                showError('Invalid File Type', 'Please select a Lua file (.lua extension) or a text file containing Lua code (.txt)');
                return;
            }
            
            loadingOverlay.style.display = 'flex';
            
            const formData = new FormData();
            formData.append('file', file);
            
            const presetInput = document.querySelector('input[name="preset"]:checked');
            if (!presetInput) {
                showError('Missing Preset', 'Please select an obfuscation preset level.');
                loadingOverlay.style.display = 'none';
                return;
            }
            
            const preset = presetInput.value;
            formData.append('preset', preset);
            
            if (preset === 'none') {
                document.querySelectorAll('.checkbox-grid input[type="checkbox"]').forEach(checkbox => {
                    formData.append(checkbox.name, checkbox.checked);
                });
            }
            
            console.log('Submitting file for obfuscation:', file.name);
            
            fetch('/api/obfuscate', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        if (data && data.error) {
                            throw new Error(data.error);
                        } else {
                            handleHttpError(response.status);
                            throw new Error(`Server error: ${response.status}`);
                        }
                    }).catch(jsonError => {
                        handleHttpError(response.status);
                        throw new Error(`Server error: ${response.status}`);
                    });
                }
                
                return response.json().then(data => {
                    return data;
                }).catch(jsonError => {
                    throw new Error('Invalid response format from server');
                });
            })
            .then(data => {
                loadingOverlay.style.display = 'none';
                
                if (data.success) {
                    currentFileId = data.file_id;
                    
                    if (!editor) {
                        require(['vs/editor/editor.main'], function() {
                            console.log('Monaco editor loaded');
                            editor = monaco.editor.create(monacoContainer, {
                                value: data.obfuscated_code,
                                language: 'lua',
                                theme: 'vs-dark',
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                minimap: { enabled: true },
                                readOnly: true,
                                lineNumbers: 'off',
                                wordWrap: 'on',
                                roundedSelection: false,
                                contextmenu: false,
                                renderIndentGuides: true,
                                fontFamily: 'Consolas, "Courier New", monospace',
                                fontSize: 14,
                                maxTokenizationLineLength: 200000 
                            });
                        });
                    } else {
                        editor.setValue(data.obfuscated_code);
                    }
                    
                    document.querySelector('.upload-container').style.display = 'none';
                    resultContainer.style.display = 'block';
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })
            .catch(error => {
                loadingOverlay.style.display = 'none';
                showError('Obfuscation Failed', 'An error occurred during the code obfuscation process: ' + error.message, 'ERR_OBFUSCATION');
                console.error('Obfuscation error:', error);
            });
        } catch (error) {
            loadingOverlay.style.display = 'none';
            showError('Unexpected Error', 'An unexpected error occurred: ' + error.message, 'ERR_SUBMISSION');
            console.error('Form submission error:', error);
        }
    });
    
    downloadBtn.addEventListener('click', function() {
        if (!currentFileId) {
            showError('Download Error', 'No obfuscated file is available to download. Please obfuscate a file first.');
            return;
        }
        
        fetch(`/api/files/${currentFileId}`)
            .then(response => {
                if (!response.ok) {
                    handleHttpError(response.status);
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const blob = new Blob([data.obfuscated_content], { type: 'text/plain' });
                
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                
                let originalFilename = data.file.original_filename;
                
                if (originalFilename.toLowerCase().endsWith('.txt')) {
                    originalFilename = originalFilename.substring(0, originalFilename.length - 4) + '.lua';
                }
                downloadLink.download = originalFilename.replace('.lua', '_obfuscated.lua');
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            })
            .catch(error => {
                console.error('Error downloading file:', error);
                showError('Download Failed', 'Failed to download the obfuscated file. The server may be unavailable or the file may no longer exist.', 'ERR_DOWNLOAD');
            });
    });
    
    copyBtn.addEventListener('click', function() {
        const code = editor ? editor.getValue() : '';
        
        navigator.clipboard.writeText(code)
            .then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                showError('Clipboard Error', 'Failed to copy the obfuscated code to clipboard. You may need to grant clipboard permission to this site.', 'ERR_CLIPBOARD');
            });
    });
    
    newFileBtn.addEventListener('click', function() {
        form.reset();
        fileInfo.textContent = 'No file selected';
        obfuscateBtn.disabled = true;
        
        document.querySelector('.upload-container').style.display = 'block';
        resultContainer.style.display = 'none';
        
        fileInput.value = '';
        currentFileId = null;
        droppedFile = null;
    });
});
