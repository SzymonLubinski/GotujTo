import {type Id} from "@gotujto/convex/_generated/dataModel";
import RecipeEditor from "@/components/web/recipe-form/RecipeEditor";

type EditRecipePageProps = {
    params: Promise<{recipeId: string}>;
};

export default async function EditRecipePage({params}: EditRecipePageProps) {
    const {recipeId} = await params;

    return <RecipeEditor mode="edit" recipeId={recipeId as Id<"recipes">} />;
}
