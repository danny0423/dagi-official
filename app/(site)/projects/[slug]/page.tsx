// 單案頁，畫面待設計，欄位見 docs/site-architecture.md「單案頁範本」
export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  return <h1>工程實績：{slug}</h1>;
}
