import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Todo = { id: string; text: string; completed?: boolean }

export default function Todos() {
    const [todos, setTodos] = useState<Todo[] | null>( null )
    const [error, setError] = useState<string | null>( null )

    useEffect( () => {
        let mounted = true
        async function getTodos() {
            const { data, error } = await supabase.from( 'todos' ).select( '*' )
            if ( !mounted ) return
            if ( error ) {
                setError( error.message )
                setTodos( [] )
                return
            }
            setTodos( ( data ?? [] ) as Todo[] )
        }
        getTodos()
        return () => {
            mounted = false
        }
    }, [] )

    if ( error ) return <div>Supabase error: {error}</div>
    if ( todos === null ) return <div>Loading todos…</div>
    if ( todos.length === 0 ) return <div>No todos found (connection works)</div>

    return (
        <ul>
            {todos.map( ( t ) => (
                <li key={t.id}>{t.text}</li>
            ) )}
        </ul>
    )
}