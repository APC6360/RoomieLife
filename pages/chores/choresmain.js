import Navbar from "@/components/Dashboard/Navbar"
import styled from 'styled-components'
import Link from 'next/link'
import { useStateContext } from '@/context/StateContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'


const ChoresMain = () => {
    return (
        <>
        <Navbar/>
        <div>ChoresMain</div>
        </>
    )
    }



export default ChoresMain