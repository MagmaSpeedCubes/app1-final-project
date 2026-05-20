const postListEl = document.getElementById('post-list');
const postContentEl = document.getElementById('post-content');

async function fetchPosts() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Failed to load posts');
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    postContentEl.innerHTML = `<div class="post-card"><h2>Oops</h2><p>Unable to load blog posts. Please try again later.</p></div>`;
    console.error(error);
    return [];
  }
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderPostList(posts) {
  postContentEl.innerHTML = '';
  postListEl.innerHTML = posts
    .map(
      (post) => `
      <article class="post-card">
        <h2>${post.title}</h2>
        <p class="meta">${post.date} · ${post.author}</p>
        <p>${post.summary}</p>
        <a class="button button-secondary" href="blog.html?post=${encodeURIComponent(post.id)}">Read full post</a>
      </article>
    `
    )
    .join('');
}

function renderPost(post) {
  postListEl.innerHTML = '';
  postContentEl.innerHTML = `
    <article class="post-card">
      <h2>${post.title}</h2>
      <p class="meta">${post.date} · ${post.author}</p>
      <p>${post.summary}</p>
    </article>
  `;

  post.cards.forEach((card, index) => {
    const cardEl = document.createElement('section');
    cardEl.className = 'content-card';
    cardEl.dataset.index = index;

    switch (card.type) {
      case 'text':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          ${card.body.split('\n').map((paragraph) => `<p>${paragraph}</p>`).join('')}
        `;
        break;
      case 'image':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          ${renderImageCard(card)}
          ${card.caption ? `<p class="figure-caption">${card.caption}</p>` : ''}
        `;
        break;
      case 'chart':
        cardEl.classList.add('chart-card');
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <p class="meta">${card.subtitle || ''}</p>
          <div class="chart-frame"></div>
        `;
        renderChart(cardEl.querySelector('.chart-frame'), card);
        break;
      case 'big-number':
        cardEl.innerHTML = `
          <div class="big-number">
            <h3>${card.title}</h3>
            <strong>${card.stat}</strong>
            <p>${card.description}</p>
          </div>
        `;
        break;
      case 'quote':
        cardEl.innerHTML = `
          <div class="quote-block">
            <p>“${card.text}”</p>
            <cite>— ${card.author}</cite>
          </div>
        `;
        break;
      case 'comparison':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <div class="comparison-grid">
            <div class="comparison-card"><h4>${card.leftTitle}</h4><p>${card.leftText}</p></div>
            <div class="comparison-card"><h4>${card.rightTitle}</h4><p>${card.rightText}</p></div>
          </div>
        `;
        break;
      case 'link':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <div class="link-embed">
            <p>${card.description}</p>
            <a href="${card.url}" target="_blank" rel="noreferrer">${card.urlLabel || card.url}</a>
          </div>
        `;
        break;
      case 'timeline':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <div class="timeline-list">
            ${card.events
              .map(
                (event) => `
                <article class="timeline-event">
                  <div class="timeline-meta"><strong>${event.time}</strong><span>${event.description}</span></div>
                  ${event.image ? `<img src="${event.image}" alt="${event.description}" />` : ''}
                </article>
              `
              )
              .join('')}
          </div>
        `;
        break;
      case 'qa':
        cardEl.innerHTML = `
          <h3>${card.title}</h3>
          <div class="qa-list">
            ${card.items
              .map(
                (item) => `
                <article class="qa-item">
                  <h4>${item.q}</h4>
                  <p>${item.a}</p>
                </article>
              `
              )
              .join('')}
          </div>
        `;
        break;
      default:
        cardEl.innerHTML = `<p>Unknown card type: ${card.type}</p>`;
    }

    postContentEl.appendChild(cardEl);
  });
}

function renderImageCard(card) {
  if (card.layout === 'carousel') {
    const id = `carousel-${Math.random().toString(36).slice(2)}`;
    return `
      <div class="carousel" id="${id}">
        ${card.items
          .map((item, index) => `<img src="${item.src}" alt="${item.alt || ''}" data-slide="${index}" style="display:${index === 0 ? 'block' : 'none'}" />`)
          .join('')}
        <div class="carousel-controls">
          <button class="carousel-button" data-action="prev" aria-label="Previous slide">‹</button>
          <button class="carousel-button" data-action="next" aria-label="Next slide">›</button>
        </div>
      </div>
    `;
  }

  if (card.layout === 'multiple') {
    return `
      <div class="figure-grid columns-2">
        ${card.items
          .map((item) => `<figure><img src="${item.src}" alt="${item.alt || ''}" /><figcaption class="figure-caption">${item.caption || ''}</figcaption></figure>`)
          .join('')}
      </div>
    `;
  }

  return `<div class="figure-grid"><img src="${card.src}" alt="${card.alt || ''}" /></div>`;
}

function renderChart(container, card) {
  const chartType = card.chartType.toLowerCase();
  if (chartType === 'table') {
    container.innerHTML = renderTable(card);
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.className = `${chartType}-canvas`;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const width = 800;
  const height = 320;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(0, 0, width, height);

  if (chartType === 'bar') drawBarChart(ctx, width, height, card);
  else if (chartType === 'line') drawLineChart(ctx, width, height, card);
  else if (chartType === 'pie') drawPieChart(ctx, width, height, card);
  else if (chartType === 'scatter') drawScatterChart(ctx, width, height, card);
  else if (chartType === 'radar') drawRadarChart(ctx, width, height, card);
  else container.innerHTML = `<p>Chart type not supported: ${card.chartType}</p>`;
}

function renderTable(card) {
  const headerCells = card.columns.map((col) => `<th>${col}</th>`).join('');
  const rows = card.rows
    .map((row) => `<tr>${row.map((item) => `<td>${item}</td>`).join('')}</tr>`)
    .join('');
  return `
    <table class="table-chart">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function drawBarChart(ctx, width, height, card) {
  const labels = card.labels || [];
  const values = card.data || [];
  const max = Math.max(...values, 1);
  const padding = 60;
  const barWidth = (width - padding * 2) / values.length - 18;

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = padding + ((height - padding * 2) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  values.forEach((value, index) => {
    const x = padding + index * (barWidth + 18);
    const barHeight = ((value / max) * (height - padding * 2)) || 0;
    ctx.fillStyle = 'rgba(124, 229, 167, 0.9)';
    ctx.fillRect(x, height - padding - barHeight, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText(labels[index] || '', x, height - padding + 20);
  });
}

function drawLineChart(ctx, width, height, card) {
  const labels = card.labels || [];
  const values = card.data || [];
  const max = Math.max(...values, 1);
  const padding = 60;
  const step = (width - padding * 2) / (values.length - 1 || 1);

  ctx.strokeStyle = 'rgba(124, 229, 167, 0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = 'rgba(124, 229, 167, 0.95)';
  values.forEach((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(labels[index] || '', x - 18, height - padding + 20);
  });
}

function drawPieChart(ctx, width, height, card) {
  const values = card.data || [];
  const labels = card.labels || [];
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  let start = -Math.PI / 2;
  const radius = Math.min(width, height) * 0.28;
  const centerX = width / 2;
  const centerY = height / 2;
  const palette = ['#7ce5a7', '#44d68e', '#67c8b0', '#a9f0d6', '#2ea57e'];

  values.forEach((value, index) => {
    const slice = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();
    const mid = start + slice / 2;
    const labelX = centerX + Math.cos(mid) * (radius + 20);
    const labelY = centerY + Math.sin(mid) * (radius + 20);
    ctx.fillStyle = '#fff';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText(labels[index] || '', labelX, labelY);
    start += slice;
  });
}

function drawScatterChart(ctx, width, height, card) {
  const points = card.data || [];
  const xMax = Math.max(...points.map((p) => p[0]), 1);
  const yMax = Math.max(...points.map((p) => p[1]), 1);
  const padding = 60;

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const x = padding + ((width - padding * 2) / 5) * i;
    const y = padding + ((height - padding * 2) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding, height - padding - y + padding);
    ctx.lineTo(width - padding, height - padding - y + padding);
    ctx.stroke();
  }

  ctx.fillStyle = '#7ce5a7';
  points.forEach((point) => {
    const x = padding + ((width - padding * 2) * point[0]) / xMax;
    const y = height - padding - ((height - padding * 2) * point[1]) / yMax;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRadarChart(ctx, width, height, card) {
  const labels = card.labels || [];
  const values = card.data || [];
  const count = labels.length;
  const max = Math.max(...values, 1);
  const radius = Math.min(width, height) * 0.32;
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 4; level += 1) {
    ctx.beginPath();
    for (let i = 0; i <= count; i += 1) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const r = (radius * level) / 4;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(124, 229, 167, 0.95)';
  ctx.fillStyle = 'rgba(124, 229, 167, 0.25)';
  ctx.beginPath();
  values.forEach((value, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (value / max) * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    ctx.fillText(labels[index] || '', x + 8, y + 6);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function initializeCarousel() {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('img'));
    let current = images.findIndex((img) => img.style.display !== 'none');
    if (current < 0) current = 0;

    const showSlide = (index) => {
      images.forEach((img, idx) => {
        img.style.display = idx === index ? 'block' : 'none';
      });
    };

    carousel.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      event.preventDefault();
      current = button.dataset.action === 'next' ? (current + 1) % images.length : (current - 1 + images.length) % images.length;
      showSlide(current);
    });
  });
}

function mountBlog() {
  fetchPosts().then((posts) => {
    const selectedId = getQueryParam('post');
    if (selectedId) {
      const selectedPost = posts.find((post) => post.id === selectedId);
      if (selectedPost) {
        renderPost(selectedPost);
        initializeCarousel();
        return;
      }
    }
    renderPostList(posts);
  });
}

mountBlog();
