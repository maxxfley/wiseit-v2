import { readTopicDraft } from "../services/topic-draft";
import { GenerateForm } from "./generate-form";

/** Lee el tema escrito en la landing (cookie) y precarga el formulario. Va dentro de <Suspense>. */
export async function GenerateFormWithDraft() {
  return <GenerateForm defaultTopic={await readTopicDraft()} />;
}
