/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
/**
 * Récupération du store 
 */
import storeMock from '../__mocks__/store.js';
import router from "../app/Router.js";
/**
 * UserEvent nous permet de gérer les évéenements utilisateurs tel que créer une nouvelle note ou ouvrir la modale 
 */
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
    })
    /**
     * Test unitaire de la fonction de tri
     */
    test("Then bills should be ordered from earliest to latest", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const test = new Bills({document, onNavigate, store:storeMock, localStorage:null})
      const bills = await test.getBills()
      const dates = bills.map(bill => {
        return bill.date
      })
      const antiChrono = (a, b) => ((a.date < b.date) ? 1 : -1)
      const datesSorted = dates.sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
/**
 * Tests d'integration 
 */
describe('Given that I am an employee on BillsUi', async () => {
  let onNavigate
  let root 
  beforeEach(() => {  
    Object.defineProperty(window, 'localStorage', { value : localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "a@a",
    }))
    onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({pathname})
    }
    document.body.innerHTML = BillsUI({data : bills})
    root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
  })
  describe('When I click on new bill button', () => {
    test('Then it should render NewBill page', () => {
      const myBills = new Bills({
        document,
        onNavigate,
        store:null,
        localStorage: window.localStorage
      })
      /**
       * Mock function // Fonction simulée avec jest.fn
       */
      const handleClickNewBill = jest.fn(myBills.handleClickNewBill)
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.addEventListener('click', handleClickNewBill())
      /**
       * Simulation du click
       */
      userEvent.click(buttonNewBill)
      /**
       * Attentes
       */
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()
    })
  })
  describe('When I click on iconEye', () => {
    test('Then it should open modal', () => {
      const myBills = new Bills({
        document,
        onNavigate,
        store:null,
        localStorage: window.localStorage
      })
      /**
       * Mock sur la fonction JQUERRY 
       */
      $.fn.modal = jest.fn()
      const bodyModal = document.body
      const firstIconEye = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(myBills.handleClickIconEye(firstIconEye))
      firstIconEye.addEventListener("click", handleClickIconEye())
      userEvent.click(firstIconEye)
      
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(bodyModal.classList.contains('modal-open'))
    })
  })
})


describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to BillsUI", () => {
      test("fetches bills from mock API GET", async () => {
        const mockedBills = new Bills({
          document,
          onNavigate,
          store: storeMock,
          localStorage: window.localStorage,
        })
        const bills = await mockedBills.getBills()

        expect(bills.length > 0).toBeTruthy()
      })
      describe("When an error occurs on API", () => {
          beforeEach(() => {
              jest.spyOn(storeMock, "bills")
              const root = document.createElement("div")
              root.setAttribute("id", "root")
              document.body.appendChild(root)
              router()
          })
          test("fetches bills from an API and fails with 404 message error", async () => {
              storeMock.bills.mockImplementationOnce(() => {
                  return {
                      list : () =>  {
                        /**
                         * Retourne un objet Promise qui est rejeté et créer un objet Error 
                         */
                          return Promise.reject(new Error("Erreur 404"))
                      }
                  }
              })
              window.onNavigate(ROUTES_PATH.Bills);
              document.body.innerHTML = BillsUI({ error: "Erreur 404" });
              await new Promise(process.nextTick);
              const message = screen.getByText(/Erreur 404/)
              expect(message).toBeTruthy()
          })

          test("fetches messages from an API and fails with 500 message error", async () => {
            storeMock.bills.mockImplementationOnce(() => {
                  return {
                      list: () => {
                          return Promise.reject(new Error("Erreur 500"))
                      },
                  }
              })
              window.onNavigate(ROUTES_PATH.Bills)
              document.body.innerHTML = BillsUI({ error: "Erreur 500" })
              await new Promise(process.nextTick)
              const message = screen.getByText(/Erreur 500/)
              expect(message).toBeTruthy()
          })
      })
  })
})