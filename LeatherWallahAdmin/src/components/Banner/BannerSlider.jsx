import {
  Navigation,
  Scrollbar,
  A11y,
  Autoplay,
  Keyboard,
  Parallax,
  Pagination,
} from 'swiper/modules'
import { FcNext, FcPrevious } from 'react-icons/fc'
import { Swiper, SwiperSlide } from 'swiper/react'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/bundle'
import { Link } from 'react-router-dom'
import NoDataFound from '../../shared/NoDataFound/NoDataFound'



const BannerSlider = ({ banners }) => {
  return (
    <div className='main-container mt-8'>
      {banners?.data?.length > 0 ? (
        <Swiper
          // install Swiper modules
          modules={[
            Navigation,
            Pagination,
            Scrollbar,
            A11y,
            Autoplay,
            Keyboard,
            Parallax,
          ]}
          slidesPerView={1}
          speed={1000}
          parallax={true}
          navigation={{
            nextEl: '.next',
            prevEl: '.prev',
          }}
          loop={true}
          autoplay={{
            delay: 3000,
          }}
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          onSwiper={() => {}}
          onSlideChange={() => {}}
        >
          <div className='relative' data-swiper-parallax-duration='2000'>
            {banners?.data?.map((banner) => (
              <SwiperSlide key={banner?.id}>
                <Link to={banner?.banner_path}>
                  <img
                    width={500}
                    height={500}
                    loading='lazy'
                    src={banner?.banner_image}
                    className='w-full h-[25vh] md:h-[40vh] lg:h-[60vh] object-fill'
                    alt='image'
                  />
                </Link>
              </SwiperSlide>
            ))}
          </div>
          <div className=''>
            <button className='prev w-10 h-10 absolute top-[43%] left-0 md:left-[10px] z-10 bg-gray-600 bg-opacity-0 hover:bg-opacity-40 rounded flex items-center justify-center transition-all duration-300'>
              <span>
                <FcPrevious className='text-4xl md:text-5xl p-1 font-light' />
              </span>
            </button>
            <button className='next w-10 h-10 absolute top-[43%] right-0 md:right-[10px] z-10 bg-gray-600 bg-opacity-0 hover:bg-opacity-40 rounded flex items-center justify-center transition-all duration-300'>
              <span>
                <FcNext className='text-4xl md:text-5xl p-1 font-light' />
              </span>
            </button>
          </div>
        </Swiper>
      ) : (
        <NoDataFound />
      )}
    </div>
  )
}

export default BannerSlider
