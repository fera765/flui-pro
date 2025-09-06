import React from 'react';
import Form from './components/Form';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Hero Section */}
      <section className="sales-hero">
        <h1>Transforme Sua Empresa com Nossa Solução</h1>
        <p>Aumente suas vendas em até 300% com nossa plataforma inovadora</p>
        <button className="cta-button">Começar Agora</button>
      </section>

      {/* Products Section */}
      <section className="sales-section">
        <h2>Nossos Produtos</h2>
        <div className="product-grid">
          <div className="product-card">
            <h3>Plano Básico</h3>
            <p>Perfeito para pequenas empresas que estão começando</p>
            <div className="product-price">R$ 99/mês</div>
            <button className="btn btn-submit">Escolher Plano</button>
          </div>
          <div className="product-card">
            <h3>Plano Profissional</h3>
            <p>Ideal para empresas em crescimento que precisam de mais recursos</p>
            <div className="product-price">R$ 199/mês</div>
            <button className="btn btn-submit">Escolher Plano</button>
          </div>
          <div className="product-card">
            <h3>Plano Enterprise</h3>
            <p>Solução completa para grandes empresas com necessidades específicas</p>
            <div className="product-price">R$ 399/mês</div>
            <button className="btn btn-submit">Escolher Plano</button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="sales-section">
        <h2>O Que Nossos Clientes Dizem</h2>
        <div className="product-grid">
          <div className="testimonial">
            <p className="testimonial-text">
              "Esta solução revolucionou nossa empresa. Nossas vendas aumentaram 250% em apenas 3 meses!"
            </p>
            <p className="testimonial-author">- Maria Silva, CEO da TechCorp</p>
          </div>
          <div className="testimonial">
            <p className="testimonial-text">
              "O melhor investimento que já fizemos. ROI de 400% no primeiro ano!"
            </p>
            <p className="testimonial-author">- João Santos, Diretor da Inovação Ltda</p>
          </div>
          <div className="testimonial">
            <p className="testimonial-text">
              "Suporte excepcional e resultados incríveis. Recomendo para qualquer empresa!"
            </p>
            <p className="testimonial-author">- Ana Costa, Gerente da StartupXYZ</p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="sales-section">
        <h2>Entre em Contato</h2>
        <Form />
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Flui Solutions. Todos os direitos reservados.</p>
        <p>Transformando empresas através da tecnologia.</p>
      </footer>
    </div>
  );
}

export default App;