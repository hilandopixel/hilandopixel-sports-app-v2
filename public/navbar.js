class NavbarHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="navbar-header-el">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            
            <!-- BRAND / LOGO RESPONSIVO -->
            <a href="/" class="navbar-brand-el flex items-center">
              <img 
                src="./logo.png" 
                alt="Hilando Pixel Logo" 
                class="h-8 sm:h-10 w-auto object-contain max-w-full transition-all duration-200"
              >
            </a>
            
            <!-- MENÚ DE NAVEGACIÓN DESKTOP -->
            <nav class="hidden md:flex items-center gap-2 sm:gap-4">
              <a href="/" class="nav-link-el" id="nav-inicio">
                <span>📅 Eventos</span>
              </a>
            </nav>

            <!-- BOTÓN HAMBURGUESA (SÓLO MÓVIL) -->
            <div class="flex md:hidden items-center">
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

        <!-- MENÚ DESPLEGABLE MÓVIL -->
        <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div class="px-4 pt-3 pb-4 space-y-2">
            <a href="/" class="nav-link-el block w-full text-left py-2 px-3 rounded-md text-base font-semibold" id="nav-inicio-mobile">
              <span>📅 Eventos</span>
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
        const isExpanded = mobileMenu.classList.toggle("hidden");
        
        // Alternar iconos de hamburguesa y 'X'
        if (isExpanded) {
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
    const currentPath = window.location.pathname.split("/").pop().toLowerCase() || "/";
    
    const navInicio = this.querySelector("#nav-inicio");
    const navInicioMobile = this.querySelector("#nav-inicio-mobile");
    const navAdmin = this.querySelector("#nav-admin");
    const navAdminMobile = this.querySelector("#nav-admin-mobile");

    if (currentPath === "/" || currentPath === "" || currentPath === "index") {
      if (navInicio) navInicio.classList.add("active");
      if (navInicioMobile) navInicioMobile.classList.add("active");
    } else if (currentPath === "admin") {
      if (navAdmin) navAdmin.classList.add("active");
      if (navAdminMobile) navAdminMobile.classList.add("active");
    }
  }
}

customElements.define('navbar-header', NavbarHeader);