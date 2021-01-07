import axios from 'axios';

export default class Recipe{ 

    constructor(id){
        this.id = id;
    }

    async getRecipe(){
        try{
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.image = res.data.recipe.image_url;
            this.author = res.data.recipe.publisher;
            this.ingredients = res.data.recipe.ingredients;
            this.url= res.data.recipe.source_url;
        }
        catch(error){
            console.log(error);
        }
    }

    calcTime(){
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng/3);
        this.time = periods * 15;
    }

    calcServings(){
        this.servings = 4;
    }

    parseIngredients(){

        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz' , 'oz' , 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {

            //uniform units
            let ingredient = el.toLowerCase();
           
            unitsLong.forEach((unit , i) =>{
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });
            //remove the parenthesis
            ingredient = ingredient.replace(/ *\([^)]*\) */g, '');

            //parse the ingredients into count, unit and ingredient
            const arrIng = ingredient.split(' ');
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;
            if(unitIndex > -1){
                //there is a unit
                const arrCount = arrIng.slice(0, unitIndex);

                let count;
                if(arrCount.length ===1){
                    count = eval(arrIng[0].replace('-','+'));   //this is an edge case, where in one of them it is written 1-1/3 instead of 1 1/3 
                }else{
                    count = eval(arrIng.slice(0, unitIndex).join('+'));
                }

                objIng={
                    count,
                    unit: arrIng[unitIndex],
                    ingredient:arrIng.slice(unitIndex +1).join(' ')
                };

            }else if(parseInt(arrIng[0],10)){
                //there is no unit, but the first element is a number
                objIng ={
                    count:parseInt(arrIng[0],10),
                    unit:'',
                    ingredient: arrIng.slice(1).join(' ')
                };

            }else if(unitIndex === -1){
                // there is no unit or number in the first position
                objIng ={
                    count:1,
                    unit:'',
                    ingredient
                };
            }

            return objIng;
        });
        this.ingredients = newIngredients;
    }

    updateServings(type){
        //servings
        const newServings = type ==='dec'? this.servings -1 : this.servings +1;

        //ingredients
        this.ingredients.forEach( ing =>{
            ing.count *= (newServings/this.servings);
        });

        this.servings = newServings;
    }
}