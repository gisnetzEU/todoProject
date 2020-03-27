//@ts-check

// html elements
/** @type {HTMLFormElement} */
const addTodoForm = document.querySelector('#add-todo-form')
const statusPanel = document.querySelector('#statusPanel');
const todoListUI = document.querySelector('.list-group');
const addButton = document.querySelector('#add');
const todoInput = document.querySelector('#title');
const deleteAllTodosButton = document.querySelector('#clear-todos');
/** @type {HTMLInputElement} */
const filterTodosInput = document.querySelector('#filter');
const emptyTodoMessage = document.querySelector('#emptyTodoMessage');
/** @type {HTMLTemplateElement} */
const todoElemTpl = document.querySelector('#todoElemTpl');

/** @type {Array<{ title: string; user: string; deadline: string; isPriority: string }>} */
let todos = null;
let filterTxt = null;
if (window.localStorage) {
    todos = readStorageTodos();
    filterTodosInput.value = readStorageFilterTxt();

    restoreTodos();
} else {
    todos = [];
    filterTxt = "";
    console.warn("LocalStorage is not supported, TODOs will not persist!!");
}

if (!('content' in document.createElement('template'))) {
    alert("Please, use a newer version of the browser with support for HTML5 templates");
}

EventListeners();
updateFilterResults();

function saveStorageTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

/**
 * @returns {Array<{ title: string; user: string; deadline: string; isPriority: string }>}
 */
function readStorageTodos() {
    let todosStr = localStorage.getItem('todos');
    let localTodos = todosStr ? JSON.parse(todosStr) : [];

    return localTodos;
}

/**
 * @param {string} filterTxt
 */
function saveStorageFilterTxt(filterTxt) {
    localStorage.setItem('filterTxt', filterTxt);
}

function readStorageFilterTxt() {
    let localFilterTxt = localStorage.getItem('filterTxt');
    localFilterTxt = localFilterTxt ? localFilterTxt : "";

    return localFilterTxt;
}

function restoreTodos() {
    todos.forEach(todo => {
        const newTodoElem = createTodoListElement(todo);
        todoListUI.appendChild(newTodoElem);
    });
    updateFilterResults();
}

function EventListeners() {
    addButton.addEventListener('click', doIt);
    deleteAllTodosButton.addEventListener('click', deleteAllTodos);
    filterTodosInput.addEventListener('input', updateFilterResults);
    window.onerror = (msg, url, lineNo, columnNo, error) => {
        console.error(url + " " + lineNo + ":" + columnNo, msg, error);
        return false;
    }
}

/**
 * 
 * @param {Event} event 
 */
function doIt(event) {
    event.preventDefault(); // avoid default config

    const todoObj = toDataObject(addTodoForm);
    todos.push(todoObj);
    saveStorageTodos();

    const newTodoElem = createTodoListElement(todoObj);
    todoListUI.appendChild(newTodoElem);
    updateFilterResults();

    const alertDiv = alertMessage('success', `${todoObj.title} added successfully!`); // generate alert div element

    statusPanel.appendChild(alertDiv); // inserting alert msg element into our secondBody
    setTimeout(function x() { // after 3 seconds alert message element will be deleted.
        alertDiv.remove();
    }, 3000);
}

/**
 * @param {{ title: string; user: string; deadline: string; isPriority: string }} todoObj Object with the TODO information
 * @returns {HTMLElement}
 */
function createTodoListElement(todoObj) {
    /** @type {HTMLElement} */
    // @ts-ignore
    var newTodo = todoElemTpl.content.cloneNode(true);

    const todoForm = newTodo.querySelector('form');

    /** @type {HTMLInputElement} */
    const titleCtl = newTodo.querySelector('input[name="title"]');
    titleCtl.value = todoObj.title;
    /** @type {HTMLSelectElement} */
    const userCtl = newTodo.querySelector('select[name="user"]');
    userCtl.value = todoObj.user;
    /** @type {HTMLInputElement} */
    const deadlineCtl = newTodo.querySelector('input[name="deadline"]');
    deadlineCtl.value = todoObj.deadline;
    /** @type {HTMLInputElement} */
    const isPriorityCtl = newTodo.querySelector('input[name="isPriority"]');
    isPriorityCtl.checked = (todoObj.isPriority === 'Y');

    /** @type {HTMLButtonElement} */
    const saveCtl = newTodo.querySelector('button[name="save"]');
    saveCtl.addEventListener('click', (e) => {
        event.preventDefault();

        const elemIndex = todos.findIndex(elem => elem === todoObj);
        if (elemIndex === -1) {
            console.error(`Element ${todoObj.title} was not found in the array!!`)
            return;
        }

        const newTodoObj = toDataObject(todoForm);
        todos[elemIndex] = newTodoObj;
        todoObj = newTodoObj;
    
        saveStorageTodos();

        updateFilterResults();
    });

    const deleteCtl = newTodo.querySelector('button[name="remove"]');
    deleteCtl.addEventListener('click', (e) => {
        event.preventDefault();

        const elemIndex = todos.findIndex(elem => elem === todoObj);
        todos.splice(elemIndex, 1); // Remove data from array
        const todoList = document.querySelectorAll('li.list-group-item');
        todoList[elemIndex].remove(); // Remove HTML element from list

        saveStorageTodos();
    });

    return newTodo;
}

/**
 * @param {string} type
 * @param {string} message
 */
function alertMessage(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`
    // @ts-ignore
    alertDiv.role = "alert";

    let alertMsg = document.createTextNode(message);
    alertDiv.appendChild(alertMsg);

    return alertDiv;
}

function deleteAllTodos() {
    event.preventDefault();

    document.querySelectorAll('li.list-group-item')
        .forEach(e => e.remove());
    todos.length = 0;
    saveStorageTodos();
}

/**
 * 
 * @param {HTMLFormElement} form 
 * @returns {{title: string; user: string; deadline: string; isPriority: string }}
 */
function toDataObject(form) {
    const formDataObj = {
        title: null,
        user: null,
        deadline: null,
        isPriority: null,
    };

    const formData = new FormData(form);

    for (let propertyName of formData.keys()) {
        formDataObj[propertyName] = formData.get(propertyName);
    }

    return formDataObj;
}

function updateFilterResults() {
    const filterTxt = filterTodosInput.value.toLowerCase();
    const todoElems = document.querySelectorAll('li.list-group-item');

    let nMatchingTodos = 0;
    if (!filterTxt) {
        // make visible all TODOs
        todoElems.forEach(e => e.className = 'list-group-item d-flex justify-content-between');
        nMatchingTodos = todoElems.length;
    } else {
        let index = 0;
        todoElems.forEach(todoElement => {
            const todoTxt = todos[index].title.toLowerCase();
            const todoMatchesFilter = todoTxt.indexOf(filterTxt) >= 0;
            if (todoMatchesFilter) nMatchingTodos++;

            todoElement.className = (todoMatchesFilter) ?
                'list-group-item d-flex justify-content-between' :
                'list-group-item d-none justify-content-between';

            index++;
        });
    }

    const hideEmptyTodoList = nMatchingTodos > 0;
    emptyTodoMessage.classList.toggle('hidden', hideEmptyTodoList);

    saveStorageFilterTxt(filterTxt);
}