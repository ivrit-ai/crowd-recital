import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";

const Footer = () => {
  return (
    <footer className="footer self-end bg-base-200 p-10 text-base-content">
      <aside>
        <a href="https://www.ivrit.ai/">
          <img
            className="avatar w-24 rounded-xl"
            src={ivritAiLogo}
            alt="ivrit.ai logo"
          />
        </a>
        <p>
          עברית.ai
          <br />
          עברים, דברו עברית
        </p>
      </aside>
      <nav>
        <h6 className="footer-title">לך תדע</h6>
        <div className="grid grid-flow-col gap-4">
          <a className="link" href="https://github.com/ivrit-ai">
            Github
          </a>
          <a className="link" href="https://huggingface.co/ivrit-ai">
            HuggingFace
          </a>
        </div>
      </nav>
    </footer>
  );
};

export default Footer;
