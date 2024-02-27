import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import {
  API_BASE_URL
} from '@/config';

Vue.use(Vuex);

new Vuex.Store();

export default new Vuex.Store({
  state: {
    cartProducts: [],

    userAccessKey: null,
    cartProductsDate: [],

    orderInfo: null
  },
  mutations: {
    updateOrderInfo(state, orderInfo) {
      state.orderInfo = orderInfo;
    },

    resetCart(state) {
      state.cartProducts = [];
      state.cartProductsDate = [];
    },
    updateCartProductAmount(state, {productId, amount}) {
      const item = state.cartProducts.find(item => item.productId === productId);

      if (item) {
        item.amount = amount;
      }
    },
    deleteCartProduct(state, productId) {
      state.cartProducts = state.cartProducts.filter(item => item.productId !== productId)
    },
    updateUserAccessKey(state, accessKey) {
      state.userAccessKey = accessKey;
    },
    updateCartProductsDate(state, items) {
      state.cartProductsDate = items;
    },
    syncCartProducts(state) {
      state.cartProducts = state.cartProductsDate.map(item => {
        return {
          productId: item.product.id,
          amount: item.quantity
        }
      })
    }
  },
  getters: {
    cartDetailProducts(state) {
      return state.cartProducts.map(item => {
        const product = state.cartProductsDate.find(p => p.product.id === item.productId)
          .product;
        return {
          ...item,
          product: {
            ...product,
            image: product.image.file.url
          }
        }
      })
    },
    cartTotalPrice(state, getters) {
      return getters.cartDetailProducts.reduce((acc, item) => (item.product.price * item
        .amount) + acc, 0);
    }
  },
  actions: {
    async loadOrderInfo(context, orderId) {
      const response = await axios.get(API_BASE_URL + '/api/orders/' + orderId, {
        params: {
          userAccessKey: context.state.userAccessKey
        }
      });
      context.commit('updateOrderInfo', response.data);
    },

    loadCart(context) {
      axios.get(API_BASE_URL + '/api/baskets', {
        params: {
          userAccessKey: context.state.userAccessKey
        }
      })
      .then(response => {
        if (!context.state.userAccessKey) {
          localStorage.setItem('userAccessKey', response.data.user.accessKey);
          context.commit('updateUserAccessKey', response.data.user.accessKey);
        }
        context.commit('updateCartProductsDate', response.data.items);
        context.commit('syncCartProducts');
      })
    },

    async addProductToCart(context, {productId, amount}) {
      await (new Promise(resolve => setTimeout(resolve, 2000)));
      axios
        .post(API_BASE_URL + '/api/baskets/products', {
          productId: productId,
          quantity: amount
        }, {
          params: {
            userAccessKey: context.state.userAccessKey
          }
        })
        .then(response => {
          context.commit('updateCartProductsDate', response.data.items);
          context.commit('syncCartProducts');
        });
    },

    async updateCartProductAmount(context, {productId, amount}) {
      context.commit('updateCartProductAmount', {productId, amount})

      if (amount < 1) {
        return
      }

      try {
        const response = await axios.put(API_BASE_URL + '/api/baskets/products', {
          productId: productId,
          quantity: amount
        }, {
          params: {
            userAccessKey: context.state.userAccessKey
          }
        });
        context.commit('updateCartProductsDate', response.data.items);
      } catch {
        context.commit('syncCartProducts');
      }
    },

    async deleteCartProduct(context, productId) {
      context.commit('deleteCartProduct')

      const response = await axios.delete(API_BASE_URL + '/api/baskets/products', {
        params: {
          userAccessKey: context.state.userAccessKey
        },
        data: {
          productId
        },
      }, {});
      context.commit('updateCartProductsDate', response.data.items);
      context.commit('syncCartProducts');
    }
  }
});
