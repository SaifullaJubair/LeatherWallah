import { useForm } from 'react-hook-form'
import { generateSlug } from '../../utils/generateSlug'
import { RxCross1 } from 'react-icons/rx'
import { useState } from 'react'

import Select from 'react-select'
import { Tooltip } from 'react-tooltip'
import { GrUpdate } from 'react-icons/gr'
import MiniSpinner from '../../shared/MiniSpinner/MiniSpinner'
import { toast } from 'react-toastify'
import { BASE_URL } from '../../utils/baseURL'

const UpdateBrandCategory = ({
  setBrandCategoryUpdateModal,
  refetch,
  categoryTypes,
  categoryLoading,
  brandUpdateData,
  user,
}) => {
  const [loading, setLoading] = useState(false)
  const [categoryId, setCategory_id] = useState(
    brandUpdateData?.category_id?._id
  )
  const { register, handleSubmit } = useForm()

  // show Brand image Preview in state
  const [imagePreview, setImagePreview] = useState(brandUpdateData?.brand_logo)

  const handleImageChange = (e) => {
    console.log(12)

    const file = e.target.files[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle Update BrandCategory
  const handleDataPost = async (data) => {
    if (data?.brand_logo[0]) {
      setLoading(true)
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'brand_logo') {
          formData.append(key, data?.brand_logo[0])
        } else formData.append(key, value)
      })

      formData.append('brand_logo_key', brandUpdateData?.brand_logo_key)

      const brand_slug = generateSlug(
        data?.brand_name ? data?.brand_name : brandUpdateData?.brand_name
      )
      formData.append('brand_slug', brand_slug)
      // formData.append('category_id', categoryId)
      formData.append('_id', brandUpdateData?._id)
      formData.append(' brand_updated_by', user?._id)
      const response = await fetch(`${BASE_URL}/brand`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
      })
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : 'Brand update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
        setLoading(false)
        setBrandCategoryUpdateModal(false)
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
        setLoading(false)
      }
    } else {
      setLoading(true)
      const sendData = {
        _id: brandUpdateData?._id,
        brand_updated_by: user?._id,
        brand_name: data?.brand_name
          ? data?.brand_name
          : brandUpdateData?.brand_name,
        brand_serial: data?.brand_serial
          ? data?.brand_serial
          : brandUpdateData?.brand_serial,
        brand_logo: brandUpdateData?.brand_logo,
        brand_status: data?.brand_status
          ? data?.brand_status
          : brandUpdateData?.brand_status,
        brand_show: data?.brand_show,

        brand_logo_key: brandUpdateData?.brand_logo_key,
        brand_slug: generateSlug(
          data?.brand_name ? data?.brand_name : brandUpdateData?.brand_name
        ),
        // category_id: categoryId
        //   ? categoryId
        //   : brandUpdateData?.category_id?._id,
      }
      const response = await fetch(`${BASE_URL}/brand`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      })
      const result = await response.json()
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message ? result?.message : 'Brand update successfully',
          {
            autoClose: 1000,
          }
        )
        refetch()
        setLoading(false)
        setBrandCategoryUpdateModal(false)
      } else {
        toast.error(result?.message || 'Something went wrong', {
          autoClose: 1000,
        })
        setLoading(false)
      }
    }
  }
  return (
    <div>
      <div>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin'>
            <div className='flex items-center justify-between mt-4'>
              <h3
                className='text-[26px] font-bold text-gray-800 capitalize'
                id='modal-title'
              >
                Update Brand Category
              </h3>
              <button
                type='button'
                className='btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3'
                onClick={() => setBrandCategoryUpdateModal(false)}
              >
                {' '}
                <RxCross1 size={20}></RxCross1>
              </button>
            </div>

            <hr className='mt-2 mb-6' />

            <form onSubmit={handleSubmit(handleDataPost)} className=''>
              <div>
                <label
                  htmlFor='UserEmail'
                  className='block text-xs font-medium text-gray-700'
                >
                  Brand Category Name
                </label>

                <input
                  {...register('brand_name')}
                  type='text'
                  placeholder='Brand Category Name'
                  defaultValue={brandUpdateData?.brand_name}
                  className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                />
              </div>

              <div className='mt-4 grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand Show Status
                  </label>
                  <select
                    {...register('brand_status')}
                    defaultValue={brandUpdateData?.brand_status}
                    className='mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full'
                  >
                    <option value='active'>Active</option>
                    <option value='in-active'>In-Active</option>
                  </select>
                </div>
                {/* <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand show
                  </label>
                  <div className='whitespace-nowrap px-4 py-2 text-gray-700 '>
                    <label
                      htmlFor='brand3'
                      className='inline-flex items-center space-x-4 cursor-pointer dark:text-gray-800'
                    >
                      <span className='relative mt-2'>
                        <input
                          id='brand3'
                          defaultChecked={brandUpdateData?.brand_show}
                          type='checkbox'
                          className='hidden peer'
                          {...register('brand_show')}
                        />
                        <div className='w-10 h-4 rounded-full shadow bg-slate-200 peer-checked:bg-bgBtnActive '></div>
                        <div className='absolute left-0 w-6 h-6 rounded-full shadow -inset-y-1 peer-checked:right-0 peer-checked:left-auto peer-checked:bg-primaryColor bg-white'></div>
                      </span>
                    </label>
                  </div>
                </div> */}
                <div>
                  <label className='block text-xs font-medium text-gray-700'>
                    Brand Category serial
                  </label>
                  <input
                    {...register('brand_serial', {
                      validate: (value) => {
                        if (value < 1) {
                          return 'serial must be greater than 0'
                        }
                      },
                    })}
                    type='number'
                    placeholder='Brand Serial'
                    className='mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2'
                    defaultValue={brandUpdateData?.brand_serial}
                  />
                </div>
                {/* <div>
                  <label className='block text-xs font-medium text-gray-700 mb-2'>
                    Category Name
                  </label>
                  {!categoryLoading && (
                    <Select
                      id='category_id'
                      name='category_id'
                      defaultValue={{
                        _id: brandUpdateData?.category_id?._id,
                        category_name:
                          brandUpdateData?.category_id?.category_name,
                      }}
                      aria-label='Category Type'
                      options={categoryTypes?.data}
                      getOptionLabel={(x) => x?.category_name}
                      getOptionValue={(x) => x?._id}
                      onChange={(selectedOption) =>
                        setCategory_id(selectedOption?._id)
                      }
                    ></Select>
                  )}
                </div> */}
              </div>
              <div className='mt-6 relative'>
                {imagePreview && (
                  <>
                    <div className='relative'>
                      <img
                        src={imagePreview}
                        alt='Preview'
                        className='w-full h-64 object-cover my-2 rounded '
                      />
                    </div>
                  </>
                )}
                <>
                  <label
                    className='p-2  bg-primaryColor  rounded cursor-pointer absolute top-2  right-2 text-white border '
                    htmlFor='brand_logo'
                    data-tooltip-id='brand-image'
                    data-tooltip-content='Upload Your Image'
                  >
                    <GrUpdate size={25} />
                    <Tooltip id='brand-image' />
                    <Tooltip />
                  </label>

                  <input
                    {...register('brand_logo', {
                      valiDate: {
                        isImage: (value) =>
                          (value[0] && value[0].type.startsWith('image/')) ||
                          'Only image files are allowed',
                      },
                    })}
                    accept='image/*'
                    type='file'
                    id='brand_logo'
                    className='mt-1  sm:text-sm p-0.5 file:cursor-pointer file:bg-primaryColor file:text-white file:border-none file:rounded file:px-2 file:py-1.5'
                    onChange={handleImageChange}
                  />
                  <p className='text-xs text-[#C9CACA]  mt-1 text-end'>
                    Upload 300x300 pixel images in PNG, JPG, or WebP format (max
                    1 MB).
                  </p>
                </>
              </div>
              <div className='flex gap-6 mt-6 justify-end'>
                <button
                  className='px-10 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor'
                  onClick={() => setBrandCategoryUpdateModal(false)}
                >
                  Cancel
                </button>
                {loading ? (
                  <div className='px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded'>
                    <MiniSpinner />
                  </div>
                ) : (
                  <button
                    className='px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded'
                    type='Submit'
                  >
                    Update
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateBrandCategory
