import Search from './models/Search';
import { elements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import Recipe from './models/Recipe';
import *  as recipeView from './views/recipeView';
import List from './models/List';
import * as listView from './views/listView';
import Likes from './models/Likes';
import * as likesView from './views/likesView';



/*Global state of our app
* search object
*current recipe object
*shopping list object
*liked recipes
*/
const state = {};

/*
*search controller
*/
const controlSearch = async () => {

    //1. get query from the view
   const query = searchView.getInput();

    if(query){
    //2. new search object and add it to the state
   state.search = new Search(query);
    }
    //3. prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try{
    //4. search for recipes
    await state.search.getResults();

    //5.render the results on UI
    clearLoader();
    searchView.renderResults(state.search.result);

    }catch(error){
        alert('Something went wrong with the search...');
        clearLoader();
    }
};

elements.searchForm.addEventListener('submit', el =>{
    el.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click' , e =>{
    const btn = e.target.closest('.btn-inline');

    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
    
});


/*
*recipe controller
*/

const controlRecipe = async() => {

    //get id from the URL
    const id = window.location.hash.replace('#','');

    if(id){
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        //create a new recipe object
        state.recipe = new Recipe(id);

        try{
        //get recipe data and parse the ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();

        //calculate servings and time
        state.recipe.calcTime();
        state.recipe.calcServings();

        //render recipe
        clearLoader();
        recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        }catch(error){
            alert('Error processing the recipe!');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/*
*List controller
*/
const controlList = () => {
    //create a new list if there is none yet
    if(!state.list) state.list = new List();

    //add each ingredient to the list and the UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};
 
//handle delete and update list item events
elements.shopping.addEventListener('click', e =>{
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        //delete the item from the state
        state.list.deleteItem(id);

        //delete the item from the UI
        listView.deleteItem(id);
    
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value , 10);
        state.list.updateCount(id, val);
    }
});




/*
*likes controller
*/

const controlLikes = () =>{

    if(! state.likes) state.likes = new Likes(); 
    const currentID = state.recipe.id;

    //user has NOT yet liked the current recipe
    if(!state.likes.isLiked(currentID)){
        
        //add like to the current state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.image);

        //toggle the like button
        likesView.toggleLikeBtn(true);

        //add like to the UI    
        likesView.renderLike(newLike);

    //user has liked the recipe
    }else{
    
        //remove the recipe from the state
       state.likes.deleteLike(currentID);

        //toggle the like button
        likesView.toggleLikeBtn(false);

        //remove the like from the UI
        likesView.deleteLike(currentID);

    }

    likesView.toggleLikesMenu(state.likes.getNumLikes());

};


//restore the liked recipes when the page loads
window.addEventListener('load', () =>{
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle the like menu button
    likesView.toggleLikesMenu(state.likes.getNumLikes());

    //render the existing likes
    state.likes.likes.forEach(like =>likesView.renderLike(like));
});



/*
//handling recipe button clicks
*/
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease ,.btn-decrease *')){
        //decrease button is clicked
        if(state.recipe.servings>1){

            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    }else if (e.target.matches('.btn-increase , .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    
    }else if(e.target.matches('.recipe__btn--add , .recipe__btn--add *')){
        //add ingredients to the shopping list
        controlList();

    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        // add the recipe to the likes list
        controlLikes();
    }
});

