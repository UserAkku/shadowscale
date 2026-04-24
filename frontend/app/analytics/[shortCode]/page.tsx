import { Metadata, ResolvingMetadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

type Props = {
  params: Promise<{ shortCode: string }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const shortCode = params.shortCode;
  return {
    title: `Analytics — shadow.sc/${shortCode}`,
    description: `Click analytics and stats for this shortened URL`,
  };
}

export default async function AnalyticsPage(props: Props) {
  const params = await props.params;
  return <AnalyticsClient shortCode={params.shortCode} />;
}
