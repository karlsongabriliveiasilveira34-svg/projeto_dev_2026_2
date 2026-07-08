const WHATSAPP_URL =
  "https://wa.me/5538999000385?text=Ol%C3%A1%2C%20conheci%20a%20Puro%20Luxo%20pelo%20site%20e%20gostaria%20de%20receber%20atendimento.";

// Biblioteca central de mídias. Troque caminhos, cortes e textos alternativos aqui.
const mediaLibrary = {
  heroFallback: {
    src: "img/648596056_18055655138695833_3134716085325390858_n..jpg",
    alt: "Homem em composição editorial de moda masculina na Puro Luxo",
    positionClass: "pos-hero",
    width: 640,
    height: 853,
    category: "editorial"
  },
  manifest: {
    src: "img/651327717_18056723159695833_7656031147707749057_n..jpg",
    alt: "Homem ajustando o relógio em uma composição de moda masculina",
    positionClass: "pos-upper",
    width: 640,
    height: 853,
    category: "editorial"
  },
  experience: {
    src: "img/590564059_18045347378695833_203209086076125668_n..jpg",
    alt: "Fachada da loja Puro Luxo Grife em Montes Claros",
    positionClass: "pos-center",
    width: 1080,
    height: 1080,
    category: "loja"
  },
  visit: {
    src: "img/683037743_18063302252695833_2902491123929730424_n..jpg",
    alt: "Detalhes de acessórios masculinos selecionados pela Puro Luxo",
    positionClass: "pos-detail",
    width: 640,
    height: 853,
    category: "detalhe"
  },
  campaignFallback: {
    src: "img/681296022_18062369774695833_4842761662044248109_n..jpg",
    alt: "Composição editorial masculina em ambiente de loja",
    positionClass: "pos-upper",
    width: 640,
    height: 853,
    category: "campanha"
  }
};

const videoLibrary = {
  heroVideo: {
    src: "img/AQPxrjuQ9VEuAjz-izkzcqKhZn_I-nssSJ1hTyWAccuSMcySVs6mgUTPuhL2h87gjC5sYse-skzNwsqeH8goztcZ4okJgvze.mp4",
    poster: mediaLibrary.heroFallback.src
  },
  campaignVideo: {
    src: "img/AQNmr9BjPz2xyoKWFUHNEyPG9hpZKRzNtITRKIbLNgpA9uDarYxJgLVkH-zaDVQNcimVQ7tZ9BI3Ht2cx1oz8hqT..mp4",
    poster: mediaLibrary.campaignFallback.src
  }
};

const selectionItems = [
  {
    number: "01",
    title: "Essenciais contemporâneos",
    text: "Bases limpas para construir presença sem excesso.",
    media: {
      src: "img/645747057_18055393025695833_4605939951582942191_n..jpg",
      alt: "Camiseta masculina preta em detalhe",
      positionClass: "pos-soft"
    }
  },
  {
    number: "02",
    title: "Casual sofisticado",
    text: "Combinações fáceis de usar, com acabamento mais preciso.",
    media: {
      src: "img/682719571_18063302261695833_1715349267160090771_n..jpg",
      alt: "Homem usando camiseta azul e bermuda clara",
      positionClass: "pos-upper"
    }
  },
  {
    number: "03",
    title: "Presença urbana",
    text: "Peças com leitura atual para a rotina e encontros.",
    media: {
      src: "img/650389322_18056651060695833_36611930581940372_n..jpg",
      alt: "Bermudas masculinas em tons sóbrios",
      positionClass: "pos-center"
    }
  },
  {
    number: "04",
    title: "Detalhes que completam",
    text: "Acessórios e acabamentos que deixam a escolha mais intencional.",
    media: {
      src: "img/683759442_18063302225695833_7386644298844078739_n..jpg",
      alt: "Composição de bermuda, boné e acessórios masculinos",
      positionClass: "pos-table"
    }
  }
];

const lookbookItems = [
  {
    caption: "Um visual que fala antes de você.",
    label: "Editorial 01",
    media: {
      src: "img/698750774_18065286416695833_3441798907026779794_n..jpg",
      alt: "Homem usando blusa clara texturizada",
      positionClass: "pos-top"
    }
  },
  {
    caption: "Elegância em cada detalhe.",
    label: "Detalhe",
    media: {
      src: "img/670420847_18061230869695833_2365367062754620413_n..jpg",
      alt: "Detalhe de camiseta masculina preta com etiqueta",
      positionClass: "pos-center"
    }
  },
  {
    caption: "Estilo para diferentes momentos.",
    label: "Seleção",
    media: {
      src: "img/670864000_18061237727695833_8772543276306609584_n..jpg",
      alt: "Composição de camiseta vermelha, calça e tênis",
      positionClass: "pos-detail"
    }
  },
  {
    caption: "Escolhas sóbrias, presença nítida.",
    label: "Curadoria",
    media: {
      src: "img/671831866_18061237763695833_7236038161549021772_n..jpg",
      alt: "Tênis branco com detalhe discreto",
      positionClass: "pos-detail"
    }
  }
];

const instagramItems = [
  {
    src: "img/730417254_18071230763695833_245359275438177860_n..jpg",
    alt: "Cinto masculino marrom em detalhe",
    positionClass: "pos-center"
  },
  {
    src: "img/731049171_18071230772695833_1695130248290000773_n..jpg",
    alt: "Cinto masculino preto em detalhe",
    positionClass: "pos-center"
  },
  {
    src: "img/731061262_18071227022695833_50933049845050633_n..jpg",
    alt: "Cinto masculino preto segurado em ambiente de loja",
    positionClass: "pos-detail"
  },
  {
    src: "img/684777607_18063308378695833_2248660388954681367_n..jpg",
    alt: "Calça escura e tênis branco em composição masculina",
    positionClass: "pos-detail"
  },
  {
    src: "img/683767903_18063302243695833_3277883410423269709_n..jpg",
    alt: "Par de sandálias pretas masculinas",
    positionClass: "pos-detail"
  },
  {
    src: "img/683701337_18063302234695833_9203048442497935917_n..jpg",
    alt: "Camiseta clara com gola em detalhe",
    positionClass: "pos-center"
  }
];

function applyMediaData() {
  document.querySelectorAll("[data-media]").forEach((image) => {
    const media = mediaLibrary[image.dataset.media];
    if (!media) return;
    image.src = media.src;
    image.alt = media.alt;
    image.width = media.width;
    image.height = media.height;
    if (media.positionClass) image.classList.add(media.positionClass);
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-media-video]").forEach((video) => {
    const media = videoLibrary[video.dataset.mediaVideo];
    if (!media || reducedMotion) return;
    video.poster = media.poster;
    const source = document.createElement("source");
    source.src = media.src;
    source.type = "video/mp4";
    video.append(source);
    video.closest(".hero-media, .campaign-media")?.classList.add("has-video");
  });
}

function imageFrame(media, loading = "lazy") {
  return `
    <figure class="image-frame reveal">
      <img class="${media.positionClass || "pos-center"}" src="${media.src}" alt="${media.alt}" loading="${loading}" width="640" height="853">
    </figure>
  `;
}

function renderSelection() {
  const grid = document.querySelector("[data-selection-grid]");
  if (!grid) return;
  grid.innerHTML = selectionItems
    .map(
      (item) => `
        <article class="selection-item reveal">
          ${imageFrame(item.media)}
          <div class="item-meta">
            <span>${item.number}</span>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderLookbook() {
  const grid = document.querySelector("[data-lookbook-grid]");
  if (!grid) return;
  grid.innerHTML = lookbookItems
    .map(
      (item) => `
        <article class="lookbook-item reveal">
          ${imageFrame(item.media)}
          <div class="lookbook-caption">
            <span>${item.caption}</span>
            <span>${item.label}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderInstagram() {
  const grid = document.querySelector("[data-instagram-grid]");
  if (!grid) return;
  grid.innerHTML = instagramItems
    .map(
      (item) => `
        <figure class="image-frame reveal">
          <img class="${item.positionClass || "pos-center"}" src="${item.src}" alt="${item.alt}" loading="lazy" width="640" height="853">
        </figure>
      `
    )
    .join("");
}

function setupHeader() {
  const header = document.querySelector("[data-header]");
  const links = [...document.querySelectorAll(".desktop-nav a")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  if (!("IntersectionObserver" in window)) return;
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => activeObserver.observe(section));
}

function setupMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  const header = document.querySelector("[data-header]");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    menu.classList.remove("is-open");
    header.classList.remove("menu-open");
    document.body.classList.remove("menu-open");
  };

  const openMenu = () => {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    menu.classList.add("is-open");
    header.classList.add("menu-open");
    document.body.classList.add("menu-open");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

function setupVideoPause() {
  const videos = document.querySelectorAll("[data-video]");
  if (!videos.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );

  videos.forEach((video) => observer.observe(video));
}

function setupFooterYear() {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
}

applyMediaData();
renderSelection();
renderLookbook();
renderInstagram();
setupHeader();
setupMenu();
setupReveal();
setupVideoPause();
setupFooterYear();

window.PuroLuxo = {
  mediaLibrary,
  videoLibrary,
  selectionItems,
  lookbookItems,
  instagramItems,
  whatsapp: WHATSAPP_URL
};
