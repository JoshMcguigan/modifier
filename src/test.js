const Store = require("./Store");
const Modifier = require("./Modifier");

describe('Store', ()=>{

    let initialState, store;

    beforeEach(()=>{
        initialState = {
            taskGroups: [
                {
                    id: 0,
                    title: 'Holiday Shopping',
                    tasks: [1, 3]
                },
                {
                    id: 1,
                    title: 'Open Source',
                    tasks: [2, 4]
                }
            ],
            tasks: {
                1: {
                    title: 'Gift for mom'
                },
                2: {
                    title: 'Responding to issues'
                },
                3: {
                    title: 'Gift for dad'
                },
                4: {
                    title: 'Writing documentation'
                }
            }

        };

        store = new Store(initialState);

        store.register(new Modifier(
            // the name of the modifier is used to call it, using the stores execute function
            'ADD_TASK_GROUP',
            [
                {
                    // selector much be a function which returns a child object or array of the state
                    selector: (state)=>state['taskGroups'],
                    // reducer function is passed the portion of the state tree selected by the selector,
                    // as well as the results of the async action, and should return updated state
                    reducerFunction: (taskGroups, asyncActionResult)=>([...taskGroups, asyncActionResult])
                }
            ],
            // the async action results are passed along to the reducer for this modifier
            ()=>new Promise(resolve => setTimeout(() => resolve({id: 2, title: 'new task group title', tasks: []}), 50))
        ));

        store.register(new Modifier(
            'ADD_TASK',
            [
                {
                    selector: (state, taskGroupId)=>state['taskGroups'].filter(taskGroup=>taskGroup.id===taskGroupId),
                    reducerFunction: ([taskGroup], newTask)=>({...taskGroup, tasks: [...taskGroup.tasks, newTask.id]})
                },
                {
                    selector: (state)=>state['tasks'],
                    reducerFunction: (tasks, newTask)=>({...tasks, [newTask.id]: {title: newTask.title}})
                }
            ],
            (taskGroupId)=>new Promise(resolve => setTimeout(() => resolve({id: 5, title: 'new task title'}), 50))
        ));

    });

    describe('store', ()=>{
        it('should correctly initialize state', ()=>{
            expect(store.state).toEqual(initialState);
        });

        it('should return a deep copy of state (not the original)', ()=>{
            // shallow equals check here confirms a copy was returned
            expect(store.state).not.toBe(initialState);
        });
    });

    describe('ADD_TASK_GROUP', ()=> {
        it('should set the loading flag on the appropriate data while async function is running', async (done)=>{
            const executePromise = store.execute('ADD_TASK_GROUP');

            // Jest toEqual only looks at enumerable properties, so _loading is checked seperately
            expect(store.state).toEqual(initialState);
            expect(store.state['taskGroups']._loading).toEqual(true);

            await executePromise;
            done();
        });

        it('should clear the loading flag and update the data after the async function resolves', async (done)=>{
            await store.execute('ADD_TASK_GROUP');

            // Jest toEqual only looks at enumerable properties, so _loading is checked seperately
            expect(store.state['taskGroups'][2].title).toBe('new task group title');
            expect(store.state['taskGroups']._loading).toBe(undefined);

            done();
        });
    });


    describe('ADD_TASK', ()=> {
        it('pass arguments from execute to selectors and async actions', async (done)=>{
            const executePromise = store.execute('ADD_TASK', 1);

            // Jest toEqual only looks at enumerable properties, so _loading is checked seperately
            expect(store.state).toEqual(initialState);
            expect(store.state['taskGroups'][1]._loading).toEqual(true);

            await executePromise;
            done();
        });
    });

});
