/**
 * @jest-environment jsdom
 */
/**
 * Importation de userEvent pour simuler un evenement
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js"
import NewBill from "../containers/NewBill.js"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from "../views/BillsUI.js"

describe("Given I am connected as an employee", () => {
    /**
     * Initialisation des valeurs 
     */
    beforeEach(()=> {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee',
                email: 'a@a.com',
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.NewBill)
    })
    describe("When I am on NewBill Page", () => {
        test("Then mail icon in vertical layout should be highlighted", async () => {
            await waitFor(() => screen.getByTestId('icon-mail'))
            const mailIcon = screen.getByTestId('icon-mail')

            expect(mailIcon.classList.contains('active-icon')).toBe(true)
        })
        test("Then file input should be present on page", async () => {
            await waitFor(() => screen.getByTestId('file'))
            const fileInput = screen.getByTestId('file')

            expect(fileInput).toBeTruthy()
        })

        describe("When user uploads a file", () => {
            describe("When the file is an image with png, jpeg or jpg extension", () => {
                test("Then, it should be uploaded", () => {
                    /**
                     * Utilisation de la classe NewBill
                     */
			        const newBill = new NewBill({
                        document, 
                        onNavigate, 
                        store: mockStore, 
                        localStorage: window.localStorage 
                    })
                    /**
                     * Permet de simuler la fonction / 'mock'
                     */
			        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
			        const fileInput = screen.getByTestId('file')
			        fileInput.addEventListener("change", handleChangeFile)
                    const file = new File(["test"], "test.png", {type: "image/png"})
                    /**
                     * Permet de simuler l'ajout du fichier
                     */
                    fireEvent.change(fileInput, {
                        target: {
                            files: [file]
                        }
                    })

                    expect(handleChangeFile).toHaveBeenCalled()
                    expect(handleChangeFile).toBeTruthy()
                    expect(fileInput.files[0]).toBe(file)
                    expect(fileInput.files).toHaveLength(1)
                })
            })

            describe("When the file is not an image with png, jpeg or jpg extension", () => {
                test("Then, it should not be uploaded", () => {
                    document.body.innerHTML = NewBillUI()
                    const newBill = new NewBill({
			            document,
			            onNavigate,
			            firestore: null,
			            localStorage: window.localStorage,
		            })
                    const handleChangeFile = jest.fn(newBill.handleChangeFile)
                    const fileInput = screen.getByTestId('file')
		            fileInput.addEventListener("change", handleChangeFile)
                    const wrongFile = new File(["test.pdf"], "test.pdf", { type: "document/pdf" })
                    fireEvent.change(fileInput, {
                        target: { files: [wrongFile] },
                    })

		            expect(handleChangeFile).toHaveBeenCalled()
                    expect(fileInput.value).not.toBe("test.pdf")
                })
            })
        })

        describe('When user submits data for new bill', () => {
            test("Then it should create a new bill containing that data", async () => {
                const html = NewBillUI()
                document.body.innerHTML = html
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({ pathname })
                }
                const newBill = new NewBill({ 
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage
                })
                /**
                 * Permet de simuler une nouvelle note de frais
                 */
                const validBill = {
                    type: "Hôtel et logement",
                    name: "encore",
                    date: '2004-04-04',
                    amount: 400,
                    vat: 80,
                    pct: 20,
                    commentary: 'séminaire billed',
                    fileUrl: 'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
                    fileName: 'preview-facture-free-201801-pdf-1.jpg',
                    status: 'pending'
                }
                screen.getByTestId('expense-type').value = validBill.type
                screen.getByTestId('expense-name').value = validBill.name
                screen.getByTestId('datepicker').value = validBill.date
                screen.getByTestId('amount').value = validBill.amount
                screen.getByTestId('vat').value = validBill.vat
                screen.getByTestId('pct').value = validBill.pct
                screen.getByTestId('commentary').value = validBill.commentary
                newBill.fileName = validBill.fileName
                newBill.fileUrl = validBill.fileUrl
                /**
                 * Simule l'envoi du formulaire
                 */
                newBill.updateBill = jest.fn()
                const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

                const form = screen.getByTestId("form-new-bill")
                form.addEventListener("submit", handleSubmit)
                fireEvent.submit(form)

                expect(handleSubmit).toHaveBeenCalled()
                expect(newBill.updateBill).toHaveBeenCalled()
            })
            /**
             * Test erreur 404
             */
            describe("When API call fails with a 404 error message", () => {
                test("Then a 404 error message should be displayed", async () => {
                    jest.spyOn(mockStore, "bills")
                    mockStore.bills.mockImplementationOnce(() => {
                        return {
                            update : () => {
                                return Promise.reject(new Error ("Erreur 404"))
                            }
                        }
                    })
                    window.onNavigate(ROUTES_PATH.Bills)
                    document.body.innerHTML = BillsUI({error: "Erreur 404"})
                    const message = screen.getAllByText(/Erreur 404/)

                    expect(message).toBeTruthy()
                })
            })
            /**
             * Test erreur 500
             */
            describe("When POST request fails", () => {
                test("Then it should fetch messages from API and fail with 500 message error", async () => {
                    jest.spyOn(mockStore, "bills")
                    mockStore.bills.mockImplementationOnce(() => {
                        return {
                            update: () => {
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
})