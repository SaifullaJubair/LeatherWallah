import { Helmet } from 'react-helmet-async'
import { BASE_TITLE } from '../utils/baseTitle'
import { Outlet } from 'react-router-dom'
import DashBoardNavbar from '../shared/DashboardNavbar/DashboardNavbar'
import { useState } from 'react'
import SideNavBar from '../shared/SideNavBar/SideNavBar'

const DashboardLayout = () => {
  //   const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMinibarOpen, setMinibarOpen] = useState(false)
  //   useEffect(() => {
  //     setTimeout(() => {
  //       setLoading(false);
  //     }, 3000);
  //   }, []);
  //   if (loading) return <LoaderOverlay />;
  return (
    <div className='flex h-screen'>
      <Helmet>
        <title>Admin - {BASE_TITLE}</title>
      </Helmet>
      <div
        className={`hidden lg:block max-h-screen overflow-hidden overflow-y-auto scrollbar-thin transition-width duration-500 ease-in-out bg-white ${
          isSidebarOpen ? 'w-60' : 'w-0'
        }`}
      >
        <SideNavBar />
      </div>
      {/* ------ mobile menu ------ start */}
      <div
        className={`h-screen w-10/12 sm:w-4/12 fixed inset-y-0 left-0 z-50 bg-bgray-50 overflow-y-auto transition-transform duration-500 ease-in-out transform ${
          isMinibarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex min-h-screen flex-col justify-between border-e'>
          <SideNavBar />
        </div>
      </div>
      {/* ------ mobile menu ------ end */}

      {/* Main content. overflow-y-auto (not -scroll) so the scrollbar gutter +
          arrows only appear when content actually overflows, instead of a
          permanent empty track on every page. */}
      <div className='flex-1 flex flex-col sticky overflow-x-auto overflow-y-auto'>
        <header className=' bg-[#FFFFFF]'>
          <DashBoardNavbar
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isMinibarOpen={isMinibarOpen}
            setMinibarOpen={setMinibarOpen}
          />
        </header>

        {/* Main content area. `flex-1 min-h-0` (instead of min-h-screen) lets it
            fill the leftover height under the navbar WITHOUT adding the navbar's
            height on top — min-h-screen forced (100vh + navbar) and produced a
            permanent ~navbar-tall outer scroll on every page. Pages that want a
            self-contained scroll (e.g. Page Content editor) can now size to
            h-full; short pages just sit at natural height. */}
        <div className='flex-1 min-h-0 flex flex-col'>
          <div className='flex-1 min-h-0 py-4 md:px-6 px-2.5 bg-gray-50'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
