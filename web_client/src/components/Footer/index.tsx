import { useTranslation } from "react-i18next";

import ivritAiLogo from "../../assets/ivrit_ai_logo.webp";

const Footer = () => {
  const { t } = useTranslation();
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
          {t("glossary.ivritai")}
          <br />
          {t("glossary.ivritaiSlogan")}
        </p>
      </aside>
      <nav>
        <h6 className="footer-title">{t("clear_large_clownfish_dream")}</h6>
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
