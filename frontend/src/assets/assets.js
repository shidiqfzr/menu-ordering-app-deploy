import basket_icon from './basket_icon.png'
import logo from './logo.png'
import header_img from './header_img.png'
import search_icon from './search_icon.png'
import menu_1 from './menu_1.png'
import menu_2 from './menu_2.png'
import menu_3 from './menu_3.png'
import menu_4 from './menu_4.png'
import menu_5 from './menu_5.png'
import menu_6 from './menu_6.png'
import menu_7 from './menu_7.png'
import menu_8 from './menu_8.png'

import food_1 from './food_1.png'
import food_2 from './food_2.png'
import food_3 from './food_3.png'
import food_4 from './food_4.png'
import food_5 from './food_5.png'
import food_6 from './food_6.png'
import food_7 from './food_7.png'
import food_8 from './food_8.png'
import food_9 from './food_9.png'
import food_10 from './food_10.png'
import food_11 from './food_11.png'
import food_12 from './food_12.png'
import food_13 from './food_13.png'
import food_14 from './food_14.png'
import food_15 from './food_15.png'
import food_16 from './food_16.png'
import food_17 from './food_17.png'
import food_18 from './food_18.png'
import food_19 from './food_19.png'
import food_20 from './food_20.png'
import food_21 from './food_21.png'
import food_22 from './food_22.png'
import food_23 from './food_23.png'
import food_24 from './food_24.png'
import food_25 from './food_25.png'
import food_26 from './food_26.png'
import food_27 from './food_27.png'
import food_28 from './food_28.png'
import food_29 from './food_29.png'
import food_30 from './food_30.png'
import food_31 from './food_31.png'
import food_32 from './food_32.png'

import add_icon_white from './add_icon_white.png'
import add_icon_green from './add_icon_green.png'
import remove_icon_red from './remove_icon_red.png'
import app_store from './app_store.png'
import play_store from './play_store.png'
import linkedin_icon from './linkedin_icon.png'
import facebook_icon from './facebook_icon.png'
import twitter_icon from './twitter_icon.png'
import cross_icon from './cross_icon.png'
import selector_icon from './selector_icon.png'
import rating_starts from './rating_starts.png'
import profile_icon from './profile_icon.png'
import bag_icon from './bag_icon.png'
import logout_icon from './logout_icon.png'
import order_icon from './order_icon.png'
import empty_cart from './empty_cart.png'

import promo_1 from './promo_1.png'
import promo_2 from './promo_2.png'
import promo_3 from './promo_3.png'

export const promoImages = [
    { src: promo_1, alt: "Promo 1" },
    { src: promo_2, alt: "Promo 2" },
    { src: promo_3, alt: "Promo 3" },
  ];

export const assets = {
    logo,
    basket_icon,
    header_img,
    search_icon,
    rating_starts,
    add_icon_green,
    add_icon_white,
    remove_icon_red,
    app_store,
    play_store,
    linkedin_icon,
    facebook_icon,
    twitter_icon,
    cross_icon,
    selector_icon,
    profile_icon,
    logout_icon,
    bag_icon,
    order_icon,
    empty_cart
}

export const menu_list = [
    {
        menu_name: "Salad",
        menu_image: menu_1
    },
    {
        menu_name: "Rolls",
        menu_image: menu_2
    },
    {
        menu_name: "Deserts",
        menu_image: menu_3
    },
    {
        menu_name: "Sandwich",
        menu_image: menu_4
    },
    {
        menu_name: "Cake",
        menu_image: menu_5
    },
    {
        menu_name: "Pure Veg",
        menu_image: menu_6
    },
    {
        menu_name: "Pasta",
        menu_image: menu_7
    },
    {
        menu_name: "Noodles",
        menu_image: menu_8
    }
]

const formatPrice = (price) => {
    return (price / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3 }).replace(",", ".");
};

export const food_list = [
    {
        _id: "1",
        name: "Greek Salad",
        image: food_1,
        price: formatPrice(12000),
        description: "Salad segar dengan campuran sayuran khas, dilengkapi dengan saus yang nikmat",
        category: "Salad"
    },
    {
        _id: "2",
        name: "Veg Salad",
        image: food_2,
        price: formatPrice(18000),
        description: "Salad sehat dengan berbagai macam sayuran segar, cocok untuk pencinta makanan vegetarian",
        category: "Salad"
    }, {
        _id: "3",
        name: "Clover Salad",
        image: food_3,
        price: formatPrice(16000),
        description: "Salad segar dengan kombinasi bahan alami dan saus lezat yang menambah cita rasa",
        category: "Salad"
    }, {
        _id: "4",
        name: "Chicken Salad",
        image: food_4,
        price: formatPrice(24000),
        description: "Salad ayam panggang yang lezat, dipadu dengan sayuran segar dan saus pilihan",
        category: "Salad"
    }, {
        _id: "5",
        name: "Lasagna Rolls",
        image: food_5,
        price: formatPrice(14000),
        description: "Gulungan lasagna dengan isian daging dan keju yang melimpah, sempurna untuk dinikmati",
        category: "Rolls"
    }, {
        _id: "6",
        name: "Peri Peri Rolls",
        image: food_6,
        price: formatPrice(12000),
        description: "Gulungan roti dengan isi daging dan saus peri-peri yang pedas dan menggugah selera",
        category: "Rolls"
    }, {
        _id: "7",
        name: "Chicken Rolls",
        image: food_7,
        price: formatPrice(20000),
        description: "Gulungan roti dengan isian ayam yang lembut dan rasa yang nikmat",
        category: "Rolls"
    }, {
        _id: "8",
        name: "Veg Rolls",
        image: food_8,
        price: formatPrice(15000),
        description: "Gulungan roti dengan isian sayuran segar dan saus yang lezat, cocok untuk vegetarian",
        category: "Rolls"
    }, {
        _id: "9",
        name: "Ripple Ice Cream",
        image: food_9,
        price: formatPrice(14000),
        description: "Es krim dengan lapisan rasa yang berkelok, memberikan sensasi dingin yang menyegarkan",
        category: "Deserts"
    }, {
        _id: "10",
        name: "Fruit Ice Cream",
        image: food_10,
        price: formatPrice(22000),
        description: "Es krim buah yang menyegarkan, dengan rasa buah alami yang manis dan lezat",
        category: "Deserts"
    }, {
        _id: "11",
        name: "Jar Ice Cream",
        image: food_11,
        price: formatPrice(10000),
        description: "Es krim dalam kemasan jar yang praktis, memberikan kenikmatan setiap sendoknya",
        category: "Deserts"
    }, {
        _id: "12",
        name: "Vanilla Ice Cream",
        image: food_12,
        price: formatPrice(12000),
        description: "Es krim vanilla klasik dengan rasa lembut yang memanjakan lidah",
        category: "Deserts"
    },
    {
        _id: "13",
        name: "Chicken Sandwich",
        image: food_13,
        price: formatPrice(12000),
        description: "Sandwich isi ayam panggang dengan roti lembut dan bahan segar",
        category: "Sandwich"
    },
    {
        _id: "14",
        name: "Vegan Sandwich",
        image: food_14,
        price: formatPrice(18000),
        description: "Sandwich dengan isian sayuran segar yang cocok untuk vegetarian",
        category: "Sandwich"
    }, {
        _id: "15",
        name: "Grilled Sandwich",
        image: food_15,
        price: formatPrice(16000),
        description: "Sandwich panggang yang kaya rasa, dengan isian lezat dan roti renyah",
        category: "Sandwich"
    }, {
        _id: "16",
        name: "Bread Sandwich",
        image: food_16,
        price: formatPrice(24000),
        description: "Sandwich sederhana dengan roti segar dan isian yang menggugah selera",
        category: "Sandwich"
    }, {
        _id: "17",
        name: "Cup Cake",
        image: food_17,
        price: formatPrice(14000),
        description: "Kue cupcake manis dengan tekstur lembut dan topping yang menggoda",
        category: "Cake"
    }, {
        _id: "18",
        name: "Vegan Cake",
        image: food_18,
        price: formatPrice(12000),
        description: "Kue vegan yang dibuat tanpa bahan hewani, nikmat dan cocok untuk pencinta makanan nabati",
        category: "Cake"
    }, {
        _id: "19",
        name: "Butterscotch Cake",
        image: food_19,
        price: formatPrice(20000),
        description: "Kue butterscotch dengan rasa manis-karamel yang sempurna",
        category: "Cake"
    }, {
        _id: "20",
        name: "Sliced Cake",
        image: food_20,
        price: formatPrice(15000),
        description: "Kue irisan dengan rasa manis dan tekstur lembut, cocok untuk camilan",
        category: "Cake"
    }, {
        _id: "21",
        name: "Garlic Mushroom",
        image: food_21,
        price: formatPrice(14000),
        description: "Jamur bawang putih yang gurih dan lezat, cocok sebagai hidangan sampingan",
        category: "Pure Veg"
    }, {
        _id: "22",
        name: "Fried Cauliflower",
        image: food_22,
        price: formatPrice(22000),
        description: "Kembang kol goreng dengan rasa renyah dan bumbu yang menggugah selera",
        category: "Pure Veg"
    }, {
        _id: "23",
        name: "Mix Veg Pulao",
        image: food_23,
        price: formatPrice(10000),
        description: "Nasi pulao campur sayuran yang kaya rasa dan harum",
        category: "Pure Veg"
    }, {
        _id: "24",
        name: "Rice Zucchini",
        image: food_24,
        price: formatPrice(12000),
        description: "Nasi dengan zucchini segar yang penuh rasa dan menyehatkan",
        category: "Pure Veg"
    },
    {
        _id: "25",
        name: "Cheese Pasta",
        image: food_25,
        price: formatPrice(12000),
        description: "Pasta dengan saus keju yang creamy, sempurna untuk penggemar keju",
        category: "Pasta"
    },
    {
        _id: "26",
        name: "Tomato Pasta",
        image: food_26,
        price: formatPrice(18000),
        description: "Pasta dengan saus tomat segar yang manis, asam, dan lezat",
        category: "Pasta"
    }, {
        _id: "27",
        name: "Creamy Pasta",
        image: food_27,
        price: formatPrice(16000),
        description: "Pasta dengan saus krim lembut yang kaya rasa, cocok untuk pencinta pasta",
        category: "Pasta"
    }, {
        _id: "28",
        name: "Chicken Pasta",
        image: food_28,
        price: formatPrice(24000),
        description: "Pasta dengan potongan ayam dan saus yang gurih, menyajikan kenikmatan yang tak terlupakan",
        category: "Pasta"
    }, {
        _id: "29",
        name: "Buttter Noodles",
        image: food_29,
        price: formatPrice(14000),
        description: "Mie mentega yang sederhana namun lezat, cocok untuk hidangan cepat",
        category: "Noodles"
    }, {
        _id: "30",
        name: "Veg Noodles",
        image: food_30,
        price: formatPrice(12000),
        description: "Mie sayuran segar dengan bumbu ringan yang cocok untuk vegetarian",
        category: "Noodles"
    }, {
        _id: "31",
        name: "Somen Noodles",
        image: food_31,
        price: formatPrice(20000),
        description: "Mie somen yang lembut, disajikan dengan bumbu segar dan nikmat",
        category: "Noodles"
    }, {
        _id: "32",
        name: "Cooked Noodles",
        image: food_32,
        price: formatPrice(15000),
        description: "Mie yang dimasak dengan sempurna, disajikan dengan bumbu lezat",
        category: "Noodles"
    }
]
