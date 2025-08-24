import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Todo {
    id: string
    text: string
}

export default function Todos() {
    const [todos, setTodos] = useState<Todo[]>( [] )
    const [loading, setLoading] = useState( true )
    const [error, setError] = useState<string | null>( null )

    useEffect( () => {
        let mounted = true

        async function getTodos() {
            try {
                setLoading( true )
                const { data, error } = await supabase
                    .from( 'todos' )
                    .select( '*' )
                    .order( 'created_at', { ascending: false } )

                if ( error ) {
                    console.error( 'Supabase error:', error )
                    setError( `Database error: ${error.message}` )
                    return
                }

                if ( !mounted ) return

                setTodos( data || [] )
                setError( null )
            } catch ( err ) {
                console.error( 'Unexpected error:', err )
                setError( 'Failed to load todos' )
            } finally {
                if ( mounted ) {
                    setLoading( false )
                }
            }
        }

        getTodos()

        return () => {
            mounted = false
        }
    }, [] )

    if ( loading ) {
        return <div className="p-4">Loading todos...</div>
    }

    if ( error ) {
        return (
            <div className="p-4 text-red-500">
                <p>Error: {error}</p>
                <p className="text-sm text-gray-400 mt-2">
                    Make sure your Supabase database has a 'todos' table, or try creating some test data.
                </p>
            </div>
        )
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Todos</h2>
            {todos.length === 0 ? (
                <p className="text-gray-400">No todos found. The connection is working!</p>
            ) : (
                <ul className="space-y-2">
                    {todos.map( ( todo ) => (
                        <li key={todo.id} className="p-2 bg-gray-800 rounded">
                            {todo.text || JSON.stringify( todo )}
                        </li>
                    ) )}
                </ul>
            )}
        </div>
    )
}
