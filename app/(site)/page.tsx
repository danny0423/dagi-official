import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { CompanyContact } from "@/components/company-contact";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { PlaceholderText } from "@/components/placeholder-text";
import { company } from "@/lib/placeholder-company";

export const metadata: Metadata = { title: { absolute: `${company.name}｜綜合營造業` } };

const services = [
  { title: "民間建築工程", description: "從開工到取得使用執照，配合建設公司的時程與品質要求。" },
  { title: "公共工程", description: "依政府採購法參與投標，落實三級品管。" },
  { title: "危老重建營造", description: "老屋拆除、新建一條龍，協助地主與起造人走完重建流程。" },
];

const principles = [
  { title: "工期管理", description: "每週進度回報，延誤的風險提前講，不等到最後才說。" },
  { title: "品質透明", description: "依品管計畫自主檢查，檢查紀錄可以提供業主查閱。" },
  { title: "工安優先", description: "【待填：公司實際的工安制度一句話】" },
];

export default function Page() {
  return (
    <>
      <section className="home-hero concrete" aria-labelledby="hero-title">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <h1 id="hero-title">穩健營造，<br />準時交屋</h1>
            <p className="hero-company"><PlaceholderText text={`${company.name}，綜合營造業${company.grade}`} /></p>
            <p className="hero-description">承攬民間建築、公共工程與危老重建營造</p>
            <div className="hero-actions">
              <Link href="/contact" className="button-primary" data-cta="hero">工程洽詢<ArrowIcon /></Link>
              <Link href="/services" className="text-link" data-cta="hero-services">查看承攬業務<ArrowIcon diagonal /></Link>
            </div>
          </div>
          {/* 暫用隆磐建設 2021 年工地照當氛圍照（D17），上線前換成達吉自家工地照 */}
          <PhotoPlaceholder description="自家工地實景照片，不可用素材網的工地照" className="hero-photo" sizes="(max-width: 767px) 100vw, 45vw" photo={{ src: "/images/site/hero-temp-longpon.jpg", alt: "清水模基坑施工現場" }} />
        </div>
      </section>

      <div className="site-container trust-strip" role="group" aria-label="公司概況">
        {[
          { value: company.founded, label: "年成立" },
          { value: company.engineers, label: "位專任工程人員" },
          { value: company.projects, label: "件承攬工程" },
        ].map(({ value, label }) => <p key={label}><span className="trust-value"><PlaceholderText text={value} /></span><span className="trust-label">{label}</span></p>)}
      </div>

      <section className="site-container section-space" aria-labelledby="services-title">
        <div className="section-heading"><h2 id="services-title">承攬業務</h2><Link href="/services" className="text-link">查看承攬業務<ArrowIcon diagonal /></Link></div>
        <div className="service-grid">
          {services.map(({ title, description }) => (
            <Link href="/services" className="service-card" key={title}>
              <div className="service-card-heading"><h3>{title}</h3><ArrowIcon diagonal /></div>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 設計預覽：上線方式尚未決定，保留明確標示的範例；若選方式 1，移除整區。 */}
      <section className="project-section section-space" aria-labelledby="projects-title">
        <div className="site-container">
          <div className="section-heading"><h2 id="projects-title">精選工程</h2><Link href="/projects" className="text-link">查看工程實績<ArrowIcon diagonal /></Link></div>
          <div className="featured-project">
            <PhotoPlaceholder description="工地實景" />
            <div className="project-copy">
              <p className="project-example"><PlaceholderText text="【範例專案，非真實案件】" /></p>
              <h3><PlaceholderText text="【待填：工程名稱】" /></h3>
              <dl className="project-details">
                <div><dt>工程地點</dt><dd><PlaceholderText text="【待填：地點（縣市區即可）】" /></dd></div>
                <div><dt>構造規模</dt><dd><PlaceholderText text="【待填：結構與樓層，例：RC 造地上 ○ 層】" /></dd></div>
                <div><dt>工程狀態</dt><dd><PlaceholderText text="【待填：施工中／完工年份】" /></dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container section-space principles-section" aria-labelledby="principles-title">
        <h2 id="principles-title">為什麼<br className="desktop-break" />選我們</h2>
        <div className="principles-list">
          {principles.map(({ title, description }) => <article className="principle" key={title}><h3>{title}</h3><p><PlaceholderText text={description} /></p></article>)}
        </div>
      </section>

      <section className="group-section concrete" aria-labelledby="group-title">
        <div className="site-container group-grid">
          <h2 id="group-title">集團關係</h2>
          <div><p className="group-description"><PlaceholderText text="隆磐建設【待填：與新公司的關係，例：投資成立】的營造公司，【待填：一句說明成立目的，需 隆磐 確認】。" /></p>
            <Link href="/about/group" className="text-link">了解集團關係<ArrowIcon diagonal /></Link>
          </div>
        </div>
      </section>

      <section className="site-container section-space contact-section" aria-labelledby="contact-title">
        <div><h2 id="contact-title">有工程需要評估？</h2><p className="contact-description"><PlaceholderText text={`留下工程地點和規模，${company.responseTime}內由工務人員跟您聯絡。`} /></p></div>
        <div className="contact-actions"><Link href="/contact" className="button-primary" data-cta="home-contact">填寫工程洽詢<ArrowIcon /></Link><p>電話：<CompanyContact kind="phone" /></p></div>
      </section>
    </>
  );
}
