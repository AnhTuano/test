/**
 * DevTools Blocker - AGGRESSIVE MODE
 * Chặn triệt để DevTools, chỉ ADMIN mới được mở
 */

// Detect DevTools
const detectDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
        return true;
    }
    return false;
};

// Check if user is admin
const isAdmin = () => {
    const role = localStorage.getItem('ictu_role');
    return role === 'ADMIN';
};

// Block right-click context menu
export const blockContextMenu = () => {
    document.addEventListener('contextmenu', (e) => {
        if (!isAdmin()) {
            e.preventDefault();
            return false;
        }
    });
};

// Block common DevTools shortcuts
export const blockDevToolsShortcuts = () => {
    document.addEventListener('keydown', (e) => {
        // Skip if admin
        if (isAdmin()) return;

        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }

        // Ctrl+U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            return false;
        }

        // Ctrl+S (Save Page)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            return false;
        }
    });
};

// Detect and block DevTools opening
export const detectAndBlockDevTools = () => {
    let devToolsOpen = false;

    const checkInterval = setInterval(() => {
        // Skip if admin
        if (isAdmin()) {
            devToolsOpen = false;
            return;
        }

        if (detectDevTools()) {
            if (!devToolsOpen) {
                devToolsOpen = true;
                // Show warning and block
                document.body.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            font-family: system-ui, -apple-system, sans-serif;
            color: white;
            text-align: center;
            padding: 20px;
          ">
            <div>
              <h1 style="font-size: 3rem; margin-bottom: 1rem; animation: pulse 2s infinite;">🚫 CẢNH BÁO BẢO MẬT</h1>
              <p style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold;">
                Developer Tools đã bị phát hiện!
              </p>
              <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">
                Vui lòng đóng DevTools và tải lại trang.<br>
                Chỉ ADMIN mới được phép sử dụng DevTools.
              </p>
              <button 
                onclick="window.location.reload()" 
                style="
                  background: white;
                  color: #dc2626;
                  border: none;
                  padding: 15px 40px;
                  font-size: 1.2rem;
                  font-weight: bold;
                  border-radius: 50px;
                  cursor: pointer;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                  transition: transform 0.2s;
                "
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🔄 Tải lại trang
              </button>
            </div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          </style>
        `;
            }
        } else {
            devToolsOpen = false;
        }
    }, 500); // Check every 500ms (more aggressive)

    return () => clearInterval(checkInterval);
};

// Anti-debugger - AGGRESSIVE
export const antiDebugger = () => {
    setInterval(() => {
        if (!isAdmin()) {
            debugger; // This will pause execution if DevTools is open
        }
    }, 100);
};

// Disable text selection for non-admin
export const disableTextSelection = () => {
    if (!isAdmin()) {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    }
};

// Console warning
const consoleWarning = () => {
    if (!isAdmin()) {
        console.clear();
        console.log('%c🚫 CẢNH BÁO BẢO MẬT', 'color: red; font-size: 40px; font-weight: bold;');
        console.log('%cViệc sử dụng console này có thể gây nguy hiểm!', 'color: red; font-size: 20px;');
        console.log('%cChỉ ADMIN mới được phép sử dụng DevTools.', 'color: red; font-size: 16px;');
    }
};

// Initialize all protections - ALWAYS ACTIVE
export const initDevToolsBlocker = () => {
    // Always active, check admin status for each feature
    blockContextMenu();
    blockDevToolsShortcuts();
    detectAndBlockDevTools();
    antiDebugger(); // AGGRESSIVE MODE
    disableTextSelection();
    consoleWarning();

    // Re-check every 5 seconds
    setInterval(() => {
        consoleWarning();
    }, 5000);
};
