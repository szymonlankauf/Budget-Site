// DATA CONTROLLER
var budgetController = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    function calculateTotal(type) {
        var sum = 0;
        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        })
        data.totals[type] = sum;
    }

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else ID = 0;
            
            // Create new item based on 'inc' or 'exp' type
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if(type === 'inc'){
                newItem = new Income(ID, des, val);
            }

            // Push it to our data structure
            data.allItems[type].push(newItem);
            
            // Return the new element
            return newItem;
        },

        deleteItem: function(type, id) {

            var ids, index;

            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }

        },

        calculateBudget: function(){

            //calculate income and expense
            calculateTotal('inc');
            calculateTotal('exp');

            // calculate the budget
            data.budget = data.totals.inc - data.totals.exp;

            // calculate the percentage of the income we've spent
            if(data.totals.inc > 0){
                data.percentage = Math.round( (data.totals.exp / data.totals.inc) * 100 )
            } else {
                data.percentage = -1;
            }

            console.log(data.budget);

        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });

        },

        getPercentages: function() {

            var allPerc = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            })
            return allPerc;

        },

        getBudget: function() {
            return {
                budget: data.budget,
                percentage: data.percentage,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp
            }
        },

        testing: function() {
            console.log(data);
        }
    }


})();

// UI CONTROLLER
var uiController = (function() {

    var DOMStrings = {
        inputType: '.add__type',
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expensesContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expensesLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container"
    };

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMStrings.inputType).value,
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            }
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            // 1. Create html string with placeholder text

            if(type === 'inc') {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if(type === 'exp') {
                element = DOMStrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            };

            // 2. Replace the placeholder with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);

            // 3. Insert html into the dom
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(id) {

            var el = document.getElementById(id)
            el.parentNode.removeChild(el);

        },

        clearFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array){
                current.value = "";
            });

            fields[0].focus();
        },

        displayBudget: function(obj) {

            document.querySelector(DOMStrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMStrings.incomeLabel).textContent = obj.totalInc;
            document.querySelector(DOMStrings.expensesLabel).textContent = obj.totalExp;
            if(obj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '---';
            }

        },

        getDOMStrings: function() {
            return DOMStrings;
        }

    };

})();

// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, uiCtrl) {

    var setupEventListeners = function() {
        var DOM = uiCtrl.getDOMStrings();

        document.querySelector(DOM.inputBtn).addEventListener('click',ctrlAddItem);

        document.addEventListener('keypress', function(event) {
            if(event.keycode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    };

    var updateBudget = function() {
        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget in the UI
        uiCtrl.displayBudget(budgetCtrl.getBudget());

    };

    var updatePercentages = function() {
        // 1. Calculate the percentages
        budgetCtrl.calculatePercentages();

        // 2. Read the percentages from the budget controler
        budgetCtrl.getPercentages();

        // 3. Update the UI
    }

    var ctrlAddItem = function() {

        var input, newItem;

        // 1. Get the field input data
        input = uiCtrl.getInput();

        if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            uiCtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            uiCtrl.clearFields()

            // 5. Calculate the budget and display the budget
            updateBudget();

            // 6. Calculate and display the percentages
            updatePercentages();

        }
        
    };

    var ctrlDeleteItem = function(event) {

        var itemID, splitID, type, id;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if(itemID) {

            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1]);

            //console.log(type);
            //console.log(id);

            // 1. Delete item from data structure
            budgetCtrl.deleteItem(type, id);

            // 2. Delete item from the UI
            uiCtrl.deleteListItem(itemID);

            // 3. Update and display the budget
            updateBudget();

            // 4. Calculate and display the percentages
            updatePercentages();
        }

    };

    return {
        init: function() {
            console.log('Application has started');
            setupEventListeners();
            uiCtrl.displayBudget({
                budget: 0,
                percentage: -1,
                totalInc: 0,
                totalExp: 0
            })
        }
    }

})(budgetController, uiController);

controller.init();