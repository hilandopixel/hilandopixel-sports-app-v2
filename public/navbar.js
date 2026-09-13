class NavbarHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="navbar-header-el">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <!-- BRAND / LOGO -->
            <a href="/" class="navbar-brand-el flex items-center">
              <img 
                src="/logo.png" 
                alt="Hilando Pixel Logo" 
                class="h-8 sm:h-10 w-auto object-contain max-w-full transition-all duration-200"
              >
            </a>
            
            <!-- BOTÓN HAMBURGUESA (SIEMPRE VISIBLE) -->
            <div class="flex items-center">
              <button 
                id="btn-menu-mobile" 
                type="button" 
                aria-label="Abrir menú de navegación"
                class="p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <!-- Icono Abrir (Hamburguesa) -->
                <svg id="icon-menu-open" class="h-6 w-6 block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <!-- Icono Cerrar (X) -->
                <svg id="icon-menu-close" class="h-6 w-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          </div>
        </div>

        <!-- MENÚ DESPLEGABLE (SIEMPRE OCULTO HASTA HACER CLIC) -->
        <div id="mobile-menu" class="hidden border-t border-gray-200 bg-white shadow-lg">
          <div class="px-4 pt-3 pb-4 space-y-2">
            <a href="/" class="nav-link-el block w-full text-left py-2 px-3 rounded-md text-base font-semibold" id="nav-eventos">
              <span>📅 Eventos</span>
            </a>
            <a href="/larompepiernas" class="nav-link-el block w-full text-left py-2 px-3 rounded-md text-base font-semibold" id="nav-rompepiernas">
              <span>📷 La Rompepiernas 2026</span>
            </a>
            <a href="/subidaalasermitas" class="nav-link-el block w-full text-left py-2 px-3 rounded-md text-base font-semibold" id="nav-ermitas">
              <span>📷 Subida a las Ermitas 2026</span>
            </a>
            <a href="/rutadelamiel" class="nav-link-el block w-full text-left py-2 px-3 rounded-md text-base font-semibold" id="nav-miel">
              <span>📷 Ruta de la Miel 2026</span>
            </a>
          </div>
        </div>
      </header>
    `;

    this.initEvents();
    this.marcarEnlaceActivo();
  }

  initEvents() {
    const btnMenu = this.querySelector("#btn-menu-mobile");
    const mobileMenu = this.querySelector("#mobile-menu");
    const iconOpen = this.querySelector("#icon-menu-open");
    const iconClose = this.querySelector("#icon-menu-close");

    if (btnMenu && mobileMenu) {
      btnMenu.addEventListener("click", () => {
        // classList.toggle("hidden") devuelve true si la clase "hidden" ACABA de ser añadida (es decir, el menú está oculto)
        // y false si ACABA de ser retirada (el menú está visible).
        const isHidden = mobileMenu.classList.toggle("hidden");
        
        if (isHidden) {
          iconOpen.classList.remove("hidden");
          iconClose.classList.add("hidden");
        } else {
          iconOpen.classList.add("hidden");
          iconClose.classList.remove("hidden");
        }
      });
    }
  }

  marcarEnlaceActivo() {
    const currentPath = window.location.pathname.toLowerCase();
    
    const enlaces = {
      "/": this.querySelector("#nav-eventos"),
      "/larompepiernas": this.querySelector("#nav-rompepiernas"),
      "/subidaalasermitas": this.querySelector("#nav-ermitas"),
      "/rutadelamiel": this.querySelector("#nav-miel")
    };

    if (enlaces[currentPath]) {
      enlaces[currentPath].classList.add("active");
    }
  }
}

customElements.define('navbar-header', NavbarHeader);