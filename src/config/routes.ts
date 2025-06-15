import type { ComponentType } from 'react';
import Home from '../pages/Home'

interface AppRoute{
    path: string;
    element: ComponentType;
}

interface NavRoute{

}

export const APP_ROUTES: AppRoute[] = [
    {path: '/', element: Home}
]

export const NAV_ROUTES: NavRoute[] = [

]
